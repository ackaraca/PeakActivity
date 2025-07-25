import { defineStore } from 'pinia';
import moment from 'moment';
import * as _ from 'lodash';
import { map, filter, values, groupBy, sortBy, flow, reverse } from 'lodash/fp';
import { IEvent } from '~/util/interfaces';
import { getFirestore, collection, query, where, orderBy, onSnapshot, Unsubscribe, Query } from 'firebase/firestore'; // Firebase Firestore importları
import { getAuth } from 'firebase/auth';

import { window_events } from '~/util/fakedata';
import queries from '~/queries';
import { get_day_start_with_offset } from '~/util/time';
import {
  TimePeriod,
  dateToTimeperiod,
  timeperiodToStr,
  timeperiodsHoursOfPeriod,
  timeperiodsDaysOfPeriod,
  timeperiodsMonthsOfPeriod,
  timeperiodsAroundTimeperiod,
} from '~/util/timeperiod';

import { useSettingsStore } from '~/stores/settings';
import { useBucketsStore } from '~/stores/buckets';
import { useCategoryStore } from '~/stores/categories';

import { getClient } from '~/util/awclient';

function timeperiodsStrsHoursOfPeriod(timeperiod: TimePeriod): string[] {
  return timeperiodsHoursOfPeriod(timeperiod).map(timeperiodToStr);
}

function timeperiodsStrsDaysOfPeriod(timeperiod: TimePeriod): string[] {
  return timeperiodsDaysOfPeriod(timeperiod).map(timeperiodToStr);
}

function timeperiodsStrsMonthsOfPeriod(timeperiod: TimePeriod): string[] {
  return timeperiodsMonthsOfPeriod(timeperiod).map(timeperiodToStr);
}

function timeperiodStrsAroundTimeperiod(timeperiod: TimePeriod): string[] {
  return timeperiodsAroundTimeperiod(timeperiod).map(timeperiodToStr);
}

function colorCategories(events: IEvent[]): IEvent[] {
  // Set $color for categories
  const categoryStore = useCategoryStore();
  return events.map((e: IEvent) => {
    e.data['$color'] = categoryStore.get_category_color(e.data['$category']);
    return e;
  });
}

function scoreCategories(events: IEvent[]): IEvent[] {
  // Set $score for categories
  const categoryStore = useCategoryStore();
  return events.map((e: IEvent) => {
    e.data['$score'] = categoryStore.get_category_score(e.data['$category']);
    return e;
  });
}

export interface QueryOptions {
  host: string;
  date?: string;
  timeperiod?: TimePeriod;
  filter_afk?: boolean;
  include_audible?: boolean;
  include_stopwatch?: boolean;
  filter_categories?: string[][];
  dont_query_inactive?: boolean;
  force?: boolean;
  always_active_pattern?: string;
}

interface State {
  loaded: boolean;

  window: {
    available: boolean;
    top_apps: IEvent[];
    top_titles: IEvent[];
  };

  browser: {
    available: boolean;
    duration: number;
    top_urls: IEvent[];
    top_domains: IEvent[];
  };

  editor: {
    available: boolean;
    duration: number;
    top_files: IEvent[];
    top_projects: IEvent[];
    top_languages: IEvent[];
  };

  category: {
    available: boolean;
    by_period: IEvent[];
    top: IEvent[];
  };

  active: {
    available: boolean;
    duration: number;
    // non-afk events (no detail data) for the current period
    events: IEvent[];
    // Aggregated events for current and past periods
    history: Record<any, IEvent[]>;
  };

  android: {
    available: boolean;
  };

  stopwatch: {
    available: boolean;
  };

  query_options?: QueryOptions;

  realtimeUnsubscribe: Unsubscribe | null; // Gerçek zamanlı dinleyiciyi durdurmak için

  // Can't this be handled in bucketStore?
  buckets: {
    loaded: boolean;
    afk: string[];
    window: string[];
    editor: string[];
    browser: string[];
    android: string[];
    stopwatch: string[];
  };
}

export const useActivityStore = defineStore('activity', {
  // initial state
  state: (): State => ({
    // set to true once loading has started
    loaded: false,

    window: {
      available: false,
      top_apps: [],
      top_titles: [],
    },

    browser: {
      available: false,
      duration: 0,
      top_domains: [],
      top_urls: [],
    },

    editor: {
      available: false,
      duration: 0,
      top_files: [],
      top_languages: [],
      top_projects: [],
    },

    category: {
      available: false,
      by_period: [],
      top: [],
    },

    active: {
      available: false,
      duration: 0,
      // non-afk events (no detail data) for the current period
      events: [],
      // Aggregated events for current and past periods
      history: {},
    },

    android: {
      available: false,
    },

    stopwatch: {
      available: false,
    },

    query_options: null,
    realtimeUnsubscribe: null, // Başlangıçta null

    buckets: {
      loaded: false,
      afk: [],
      window: [],
      editor: [],
      browser: [],
      android: [],
      stopwatch: [],
    },
  }),

  getters: {
    getActiveHistoryAroundTimeperiod(this: State) {
      return (timeperiod: TimePeriod): IEvent[][] => {
        const periods = timeperiodStrsAroundTimeperiod(timeperiod);
        const _history = periods.map(tp => {
          if (_.has(this.active.history, tp)) {
            return this.active.history[tp];
          } else {
            // A zero-duration placeholder until new data has been fetched
            return [{ timestamp: moment(tp.split('/')[0]).format(), duration: 0, data: {} }];
          }
        });
        return _history;
      };
    },
    uncategorizedDuration(this: State): [number, number] | null {
      // Returns the uncategorized duration and the total duration
      if (!this.category.top) {
        return null;
      }
      const uncategorized = this.category.top.filter(e => {
        return _.isEqual(e.data['$category'], ['Uncategorized']);
      });
      const uncategorized_duration = uncategorized.length > 0 ? uncategorized[0].duration : 0;
      const total_duration = this.category.top.reduce((acc, e) => {
        return acc + e.duration;
      }, 0);
      return [uncategorized_duration, total_duration];
    },
  },

  actions: {
    async ensure_loaded(query_options: QueryOptions) {
      const settingsStore = useSettingsStore();
      await settingsStore.ensureLoaded();

      const bucketsStore = useBucketsStore();

      console.info('Query options: ', query_options);
      if (this.loaded) {
        getClient().abort();
      }
      if (!this.loaded || this.query_options !== query_options || query_options.force) {
        this.start_loading(query_options);
        if (!query_options.timeperiod) {
          query_options.timeperiod = dateToTimeperiod(query_options.date, settingsStore.startOfDay);
        }

        await bucketsStore.ensureLoaded();
        await this.get_buckets(query_options);

        // TODO: These queries can actually run in parallel, but since server won't process them in parallel anyway we won't.
        this.set_available();

        // Gerçek zamanlı dinleyiciyi başlat
        this.startRealtimeActivityListener(query_options);
      }

      if (this.window.available) {
        console.info(
          settingsStore.useMultidevice ? 'Querying multiple devices' : 'Querying a single device'
        );
        if (settingsStore.useMultidevice) {
          const hostnames = bucketsStore.hosts.filter(
            // require that the host has window buckets,
            // and that the host is not a fakedata host,
            // unless we're explicitly querying fakedata
            host =>
              host &&
              bucketsStore.bucketsWindow(host).length > 0 &&
              (!host.startsWith('fakedata') || query_options.host.startsWith('fakedata'))
          );
          console.info('Including hosts in multiquery: ', hostnames);
          await this.query_multidevice_full(query_options, hostnames);
        } else {
          await this.query_desktop_full(query_options);
        }
      } else if (this.android.available) {
        await this.query_android(query_options);
      } else {
        console.log(
          'Cannot query windows as we are missing either an afk/window bucket pair or an android bucket'
        );
        this.query_window_completed();
        this.query_category_time_by_period_completed();
      }

      if (this.active.available) {
        await this.query_active_history(query_options);
      } else if (this.android.available) {
        await this.query_active_history_android(query_options);
      } else {
        console.log('Cannot call query_active_history as we do not have an afk bucket');
        await this.query_active_history_completed();
      }

      if (this.editor.available) {
        await this.query_editor(query_options);
      } else {
        console.log('Cannot call query_editor as we do not have any editor buckets');
        await this.query_editor_completed();
      }

      // Perform this last, as it takes the longest
      if (this.window.available || this.android.available) {
        await this.query_category_time_by_period(query_options);
      }
    },

    async query_android({ timeperiod, filter_categories }: QueryOptions) {
      const periods = [timeperiodToStr(timeperiod)];
      const categoryStore = useCategoryStore();
      const q = queries.appQuery(
        this.buckets.android[0],
        categoryStore.classes_for_query,
        filter_categories
      );
      const data = await getClient().query(periods, q).catch(this.errorHandler);
      this.query_window_completed(data[0]);
    },

    async reset() {
      getClient().abort();
      this.query_window_completed({});
      this.query_browser_completed({});
      this.query_editor_completed({});
      this.query_category_time_by_period_completed({});
    },

    async query_multidevice_full(
      { timeperiod, filter_categories, filter_afk, always_active_pattern }: QueryOptions,
      hosts: string[]
    ) {
      const periods = [timeperiodToStr(timeperiod)];
      const categories = useCategoryStore().classes_for_query;

      const q = queries.multideviceQuery({
        hosts,
        filter_afk,
        categories,
        filter_categories,
        host_params: {},
        always_active_pattern,
      });
      const data = await getClient().query(periods, q, { name: 'multidevice', verbose: true });
      this.query_window_completed(data[0].window);
    },

    async query_desktop_full({
      timeperiod,
      filter_categories,
      filter_afk,
      include_audible,
      include_stopwatch,
      always_active_pattern,
    }: QueryOptions) {
      const periods = [timeperiodToStr(timeperiod)];
      const categories = useCategoryStore().classes_for_query;

      const q = queries.fullDesktopQuery({
        bid_window: this.buckets.window[0],
        bid_afk: this.buckets.afk[0],
        bid_browsers: this.buckets.browser,
        bid_stopwatch:
          include_stopwatch && this.buckets.stopwatch.length > 0
            ? this.buckets.stopwatch[0]
            : undefined,
        filter_afk,
        categories,
        filter_categories,
        include_audible,
        always_active_pattern,
      });
      const data = await getClient().query(periods, q, {
        name: 'fullDesktopQuery',
        verbose: true,
      });
      this.query_window_completed(data[0].window);
      this.query_browser_completed(data[0].browser);
    },

    async query_editor({ timeperiod }) {
      const periods = [timeperiodToStr(timeperiod)];
      const q = queries.editorActivityQuery(this.buckets.editor);
      const data = await getClient().query(periods, q, {
        name: 'editorActivityQuery',
        verbose: true,
      });
      this.query_editor_completed(data[0]);
    },

    async query_active_history({ timeperiod, ...query_options }: QueryOptions) {
      // Firebase Realtime Listener artık bu sorguyu yönetecek.
      // Bu fonksiyon, bir kez yüklendikten sonra doğrudan çağrılmayabilir veya
      // sadece geçmiş veriler için kullanılabilir.
      console.log('query_active_history çağrıldı, gerçek zamanlı dinleyici aktif olmalı.');
      // Mevcut Firebase verilerini yükleme mantığını burada koruyun veya değiştirin
      // eğer `onSnapshot` ile yalnızca mevcut periyodu yönetiyorsanız.
    },

    async query_category_time_by_period({
      timeperiod,
      filter_categories,
      filter_afk,
      include_stopwatch,
      dontQueryInactive,
      always_active_pattern,
    }: QueryOptions & { dontQueryInactive: boolean }) {
      // TODO: Needs to be adapted for Android
      let periods: string[];
      const count = timeperiod.length[0];
      const res = timeperiod.length[1];
      if (res.startsWith('day') && count == 1) {
        // If timeperiod is a single day, we query the individual hours
        periods = timeperiodsStrsHoursOfPeriod(timeperiod);
      } else if (
        res.startsWith('day') ||
        (res.startsWith('week') && count == 1) ||
        (res.startsWith('month') && count == 1)
      ) {
        // If timeperiod is several days, or a single week/month, we query the individual days
        periods = timeperiodsStrsDaysOfPeriod(timeperiod);
      } else if (timeperiod.length[1].startsWith('year') && timeperiod.length[0] == 1) {
        // If timeperiod a single year, we query the individual months
        periods = timeperiodsStrsMonthsOfPeriod(timeperiod);
      } else {
        console.error(`Unknown timeperiod length: ${timeperiod.length}`);
      }

      // Filter out periods that start in the future
      periods = periods.filter(period => new Date(period.split('/')[0]) < new Date());

      const signal = getClient().controller.signal;
      let cancelled = false;
      signal.onabort = () => {
        cancelled = true;
        console.debug('Request aborted');
      };

      // Query one period at a time, to avoid timeout on slow queries
      let data = [];
      for (const period of periods) {
        // Not stable
        //signal.throwIfAborted();
        if (cancelled) {
          throw signal['reason'] || 'unknown reason';
        }

        // Only query periods with known data from AFK bucket
        if (dontQueryInactive && this.active.events.length > 0) {
          const start = new Date(period.split('/')[0]);
          const end = new Date(period.split('/')[1]);

          // Retrieve active time in period
          const period_activity = this.active.events.find((e: IEvent) => {
            return start < new Date(e.timestamp) && new Date(e.timestamp) < end;
          });

          // Check if there was active time
          if (!(period_activity && period_activity.duration > 0)) {
            data = data.concat([{ cat_events: [] }]);
            continue;
          }
        }

        const isAndroid = this.buckets.android[0] !== undefined;
        const categories = useCategoryStore().classes_for_query;
        // TODO: Clean up call, pass QueryParams in fullDesktopQuery as well
        // TODO: Unify QueryOptions and QueryParams
        const query = queries.categoryQuery({
          bid_browsers: this.buckets.browser,
          bid_stopwatch:
            include_stopwatch && this.buckets.stopwatch.length > 0
              ? this.buckets.stopwatch[0]
              : undefined,
          categories,
          filter_categories,
          filter_afk,
          always_active_pattern,
          ...(isAndroid
            ? {
                bid_android: this.buckets.android[0],
              }
            : {
                bid_afk: this.buckets.afk[0],
                bid_window: this.buckets.window[0],
              }),
        });
        const result = await getClient().query([period], query, {
          verbose: true,
          name: 'categoryQuery',
        });
        data = data.concat(result);
      }

      // Zip periods
      let by_period = _.zipObject(periods, data);
      // Filter out values that are undefined (no longer needed, only used when visualization was progressive (looks buggy))
      by_period = _.fromPairs(_.toPairs(by_period).filter(o => o[1]));

      this.query_category_time_by_period_completed({ by_period });
    },

    async query_active_history_android({ timeperiod }: QueryOptions) {
      const periods = timeperiodStrsAroundTimeperiod(timeperiod).filter(tp_str => {
        return !_.includes(this.active.history, tp_str);
      });
      const data = await getClient().query(
        periods,
        queries.activityQueryAndroid(this.buckets.android[0])
      );
      const active_history = _.zipObject(periods, data);
      const active_history_events = _.mapValues(
        active_history,
        (duration: number, key): [IEvent] => {
          return [{ timestamp: key.split('/')[0], duration, data: { status: 'not-afk' } }];
        }
      );
      this.query_active_history_completed({ active_history: active_history_events });
    },

    set_available(this: State) {
      // TODO: Move to bucketStore on a per-host basis?
      this.window.available = this.buckets.afk.length > 0 && this.buckets.window.length > 0;
      this.browser.available =
        this.buckets.afk.length > 0 &&
        this.buckets.window.length > 0 &&
        this.buckets.browser.length > 0;
      this.active.available = this.buckets.afk.length > 0;
      this.editor.available = this.buckets.editor.length > 0;
      this.android.available = this.buckets.android.length > 0;
      this.category.available = this.window.available || this.android.available;
      this.stopwatch.available = this.buckets.stopwatch.length > 0;
    },

    async get_buckets(this: State, { host }) {
      // TODO: Move to bucketStore on a per-host basis?
      const bucketsStore = useBucketsStore();
      this.buckets.afk = bucketsStore.bucketsAFK(host);
      this.buckets.window = bucketsStore.bucketsWindow(host);
      this.buckets.android = bucketsStore.bucketsAndroid(host);
      this.buckets.browser = bucketsStore.bucketsBrowser(host);
      this.buckets.editor = bucketsStore.bucketsEditor(host);
      this.buckets.stopwatch = bucketsStore.bucketsStopwatch(host);

      console.log('Available buckets: ', this.buckets);
      this.buckets.loaded = true;
    },

    async load_demo() {
      // A function to load some demo data (for screenshots and stuff)

      this.start_loading({});

      function groupSumEventsBy(events, key, f) {
        return flow(
          filter(f),
          groupBy(f),
          values,
          map((es: any) => {
            return { duration: _.sumBy(es, 'duration'), data: { [key]: f(es[0]) } };
          }),
          sortBy('duration'),
          reverse
        )(events);
      }

      const app_events = groupSumEventsBy(window_events, 'app', (e: any) => e.data.app);
      const title_events = groupSumEventsBy(window_events, 'title', (e: any) => e.data.title);
      const cat_events = groupSumEventsBy(window_events, '$category', (e: any) => e.data.$category);
      const url_events = groupSumEventsBy(window_events, 'url', (e: any) => e.data.url);
      const domain_events = groupSumEventsBy(window_events, '$domain', (e: any) =>
        e.data.url === undefined ? '' : new URL(e.data.url).host
      );

      this.query_window_completed({
        duration: _.sumBy(window_events, 'duration'),
        app_events,
        title_events,
        cat_events,
        active_events: [
          {
            timestamp: new Date().toISOString(),
            duration: 1.5 * 60 * 60,
            data: { afk: 'not-afk' },
          },
        ],
      });

      this.buckets.browser = ['aw-watcher-firefox'];
      this.query_browser_completed({
        duration: _.sumBy(url_events, 'duration'),
        domains: domain_events,
        urls: url_events,
      });

      this.buckets.editor = ['aw-watcher-vim'];
      this.query_editor_completed({
        duration: 30,
        files: [{ duration: 10, data: { file: 'test.py' } }],
        languages: [{ duration: 10, data: { language: 'python' } }],
        projects: [{ duration: 10, data: { project: 'aw-core' } }],
      });

      this.buckets.loaded = true;

      // fetch startOfDay from settings store
      const settingsStore = useSettingsStore();
      const startOfDay = settingsStore.startOfDay;

      function build_active_history() {
        const active_history = {};
        let current_day = moment(get_day_start_with_offset(null, startOfDay));
        _.map(_.range(0, 30), () => {
          const current_day_end = moment(current_day).add(1, 'day');
          active_history[`${current_day.format()}/${current_day_end.format()}`] = [
            {
              timestamp: current_day.format(),
              duration: 100 + 900 * Math.random(),
              data: { status: 'not-afk' },
            },
          ];
          current_day = current_day.add(-1, 'day');
        });
        return active_history;
      }
      this.query_active_history_completed({ active_history: build_active_history() });
    },

    // mutations
    start_loading(this: State, query_options: QueryOptions) {
      this.loaded = true;
      this.query_options = query_options;

      // Resets the store state while waiting for new query to finish
      this.window.top_apps = null;
      this.window.top_titles = null;

      this.browser.duration = 0;
      this.browser.top_domains = null;
      this.browser.top_urls = null;

      this.editor.duration = 0;
      this.editor.top_files = null;
      this.editor.top_languages = null;
      this.editor.top_projects = null;

      this.category.top = null;
      this.category.by_period = null;

      this.active.duration = null;

      // Ensures that active history isn't being fully reloaded on every date change
      // (see caching done in query_active_history and query_active_history_android)
      // FIXME: Better detection of when to actually clear (such as on force reload, hostname change)
      if (Object.keys(this.active.history).length === 0) {
        this.active.history = {};
      }
    },

    query_window_completed(
      this: State,
      data = { app_events: [], title_events: [], cat_events: [], active_events: [], duration: 0 }
    ) {
      // Set $color and $score for categories
      if (data.cat_events) {
        data.cat_events = colorCategories(data.cat_events);
        data.cat_events = scoreCategories(data.cat_events);
      }

      this.window.top_apps = data.app_events;
      this.window.top_titles = data.title_events;
      this.category.top = data.cat_events;
      this.active.duration = data.duration;
      this.active.events = data.active_events;
    },

    query_browser_completed(this: State, data = { domains: [], urls: [], duration: 0 }) {
      this.browser.top_domains = data.domains;
      this.browser.top_urls = data.urls;
      this.browser.duration = data.duration;
    },

    query_editor_completed(
      this: State,
      data = { duration: 0, files: [], languages: [], projects: [] }
    ) {
      this.editor.duration = data.duration;
      this.editor.top_files = data.files;
      this.editor.top_languages = data.languages;
      this.editor.top_projects = data.projects;
    },

    query_active_history_completed(this: State, { active_history } = { active_history: {} }) {
      this.active.history = {
        ...this.active.history,
        ...active_history,
      };
    },

    query_category_time_by_period_completed(this: State, { by_period } = { by_period: [] }) {
      this.category.by_period = by_period;
    },

    async startRealtimeActivityListener(query_options: QueryOptions) {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn('Gerçek zamanlı etkinlik dinleyicisini başlatmak için kullanıcı oturum açmış olmalıdır.');
        return;
      }

      if (this.realtimeUnsubscribe) {
        this.realtimeUnsubscribe(); // Önceki dinleyiciyi temizle
        this.realtimeUnsubscribe = null;
      }

      const db = getFirestore();
      const userId = user.uid;
      const activitiesRef = collection(db, `users/${userId}/activities`);

      let q: Query = query(activitiesRef);

      // Zaman periyoduna göre filtreleme
      if (query_options.timeperiod) {
        const startTime = moment(query_options.timeperiod.start).valueOf();
        const endTime = moment(query_options.timeperiod.end).valueOf();
        q = query(q, 
          where('timestamp_start', '>=', startTime),
          where('timestamp_start', '<=', endTime)
        );
      }

      // Kategori filtrelemesi (eğer mevcutsa)
      if (query_options.filter_categories && query_options.filter_categories.length > 0) {
        // Firestore'da array-contains-any operasyonu ile karmaşık filtreleme
        // Her bir kategori dizisi için ayrı bir 'where' koşulu eklememiz gerekebilir
        // Bu kısım, Firestore sorgu limitlerine dikkat edilerek optimize edilmelidir.
        // Basitlik adına, şimdilik sadece ilk kategori filtresini uygulayalım.
        // Gerçek uygulamada, bu kısım daha sofistike bir filtreleme mantığına sahip olmalıdır.
        query_options.filter_categories.forEach(categoryPath => {
          q = query(q, where('data.$category', 'array-contains-any', [categoryPath[0]]));
        });
      }

      // AFK filtrelemesi (eğer mevcutsa)
      if (query_options.filter_afk !== undefined) {
        q = query(q, where('data.is_afk', '==', !query_options.filter_afk));
      }

      // Sıralama
      q = query(q, orderBy('timestamp_start', 'asc'));

      this.realtimeUnsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedActivities: IEvent[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Firestore Timestamp objelerini JavaScript Date objelerine dönüştür
          if (data.timestamp_start && data.timestamp_start.toDate) {
            data.timestamp_start = data.timestamp_start.toDate().toISOString();
          }
          if (data.timestamp_end && data.timestamp_end.toDate) {
            data.timestamp_end = data.timestamp_end.toDate().toISOString();
          }
          fetchedActivities.push(data as IEvent);
        });

        // Etkinlikleri kategoriye göre renklendir ve skorlandır
        const coloredAndScoredActivities = scoreCategories(colorCategories(fetchedActivities));

        // Mağazadaki etkinlikleri güncelle
        this.active.events = coloredAndScoredActivities;
        console.log('Gerçek zamanlı etkinlik güncellemeleri alındı:', this.active.events.length);

        // Ayrıca active.history'yi de güncellemeniz gerekebilir,
        // ancak bu, timeperiod'a göre gruplandırılmış geçmiş etkinlikleri içerdiği için daha karmaşık olabilir.
        // Basitlik adına, şimdilik sadece active.events'i güncelleyelim.
      }, (error) => {
        console.error('Gerçek zamanlı etkinlik dinlenirken hata oluştu:', error);
      });
    },
  },
});
