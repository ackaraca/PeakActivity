<template lang="pug">
div
  h3 Hedefler

  b-alert(variant="warning" show)
    | Bu özellik hala geliştirme aşamasındadır.

  b-alert(v-if="error" show variant="danger")
    | {{ error }}

  h4 Mevcut Hedefler
  b-card(v-for="alert in alerts", :key="alert.name")
    b-button.float-right(@click="deleteAlert(alert.name)" size="sm" variant="outline-danger")
      icon(name="trash")

    div Hedef Adı: {{ alert.name }}
    div Kategori: {{ alert.category.join(" > ") }}
    div Mevcut Süre: {{ alertTime(alert.category) | friendlyduration }} / {{ alert.goal }} dakika
      span(v-if="alertTime(alert.category) >= alert.goal")
        icon(name="check" style="color: #0C0")
      span(v-else)
        icon(name="times" color="#555")

  b-input-group.mt-3
    b-btn(@click="check" variant="success") Kontrol Et
    b-input-group-append
      b-form-checkbox.my-2.ml-3(v-model="autorefresh", @change="toggleAutoRefresh", switch) Her 10 saniyede bir otomatik yenilemeyi aç/kapat

  small(v-if="last_updated")
    | Son güncelleme: {{ last_updated }}

  hr

  div
    h4 Yeni Hedef Ekle
    b-form-group(label="Ad" label-cols-md=2)
      b-input(v-model="editing_alert.name")
    b-form-group(label="Kategori" label-cols-md=2)
      b-select(v-model="editing_alert.category")
        option(v-for="category in categories" :value="category.value") {{ category.text }}
    b-form-group(label="Hedef" label-cols-md=2)
      b-input-group(append="dakika")
        b-input(v-model="editing_alert.goal" type="number")

    div
      b-btn(@click="addAlert" variant="success")
        icon(name="plus")
        | Hedef Ekle

  hr

  h3 Anomali Uyarıları
  div(v-if="loadingAnomalies") Anomali uyarıları yükleniyor...
  div(v-else-if="anomalyAlerts.length === 0") Hiç anomali uyarısı bulunmamaktadır.
  b-card(v-for="anomaly in anomalyAlerts", :key="anomaly.date")
    div.mb-2
      strong Tarih:
      | {{ anomaly.date }}
    div.mb-2
      strong Anomali Mi?:
      | {{ anomaly.is_anomaly ? 'Evet' : 'Hayır' }}
    div.mb-2(v-if="anomaly.anomaly_score")
      strong Anomali Skoru:
      | {{ anomaly.anomaly_score.toFixed(2) }}
    div.mb-2(v-if="anomaly.deviation_percent")
      strong Sapma Yüzdesi:
      | %{{ anomaly.deviation_percent.toFixed(2) }}
    div.mb-2(v-if="anomaly.explanation")
      strong Açıklama:
      | {{ anomaly.explanation }}

</template>

<style scoped lang="scss"></nstyle>

<script setup lang="ts">
import _ from 'lodash';
import moment from 'moment';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { canonicalEvents } from '~/queries';
import 'vue-awesome/icons/plus';
import 'vue-awesome/icons/check';
import 'vue-awesome/icons/times';
import 'vue-awesome/icons/trash';
import { useBucketsStore } from '~/stores/buckets';
import { useCategoryStore } from '~/stores/categories';
import { httpsCallable } from 'firebase/functions';
import { functions } from '~/firebase';

interface Alert {
  name: string;
  category: string[];
  goal: number;
}

interface AnomalyAlert {
  date: string; // Tarih
  is_anomaly: boolean; // Anomali olup olmadığı
  anomaly_score?: number; // Anomali skoru
  deviation_percent?: number; // Sapma yüzdesi
  explanation?: string; // Açıklama
}

const bucketsStore = useBucketsStore();
const categoryStore = useCategoryStore();

const alerts = ref<Alert[]>([
  { name: 'Çalışma', category: ['Work'], goal: 100 },
  { name: 'Medya', category: ['Media'], goal: 10 },
]);
const editing_alert = ref<Partial<Alert>>({});
const alert_times = ref<Record<string, number>>({});
const error = ref<string>('');
const hostnames = ref<string[]>([]);
const hostname = ref<string>('');
const last_updated = ref<Date | null>(null);
const autorefresh = ref<boolean>(false);
const running_interval = ref<number | null>(null);
const anomalyAlerts = ref<AnomalyAlert[]>([]);
const loadingAnomalies = ref<boolean>(false);

const categories = computed(() => {
  return categoryStore.category_select(true);
});

const alertTime = computed(() => (cat: string[]) => {
  let time = 0;
  _.map(Object.entries(alert_times.value), ([c, t]) => {
    if (c.startsWith(cat.join(','))) {
      if (typeof t === 'number') time += t;
    }
  });
  return time;
});

onMounted(async () => {
  await bucketsStore.ensureLoaded();
  await categoryStore.load();
  hostnames.value = bucketsStore.hosts;
  hostname.value = hostnames.value[0];
  await fetchAnomalyAlerts();
});

onUnmounted(() => {
  if (running_interval.value) {
    clearInterval(running_interval.value);
  }
});

const addAlert = () => {
  alerts.value = alerts.value.concat({ ...editing_alert.value } as Alert);
  editing_alert.value = {};
};

const deleteAlert = (name: string) => {
  alerts.value = alerts.value.filter(a => a.name !== name);
};

const toggleAutoRefresh = () => {
  if (!autorefresh.value || running_interval.value) {
    console.log('Otomatik yenileme durduruluyor');
    if (running_interval.value) {
      clearInterval(running_interval.value);
    }
    autorefresh.value = false;
    running_interval.value = null;
  } else {
    console.log('Otomatik yenileme başlatılıyor');
    autorefresh.value = true;
    running_interval.value = setInterval(check, 10000) as unknown as number;
  }
};

const check = async () => {
  let query = canonicalEvents({
    bid_window: 'aw-watcher-window_' + hostname.value,
    bid_afk: 'aw-watcher-afk_' + hostname.value,
    filter_afk: true,
    categories: categoryStore.classes_for_query,
    filter_categories: null,
  });
  query += '; RETURN = events;';

  const query_array = query.split(';').map(s => s.trim() + ';');

  const start = moment().subtract(1, 'days').startOf('day');
  const end = moment(start).add(1, 'days');
  const timeperiods = [start.format() + '/' + end.format()];

  try {
    const awClient = (window as any).$aw;
    if (!awClient) {
      throw new Error('AWClient is not initialized.');
    }
    const data = await awClient.query(timeperiods, query_array);
    const events = data[0];
    error.value = '';

    const grouped = _.groupBy(events, (e: any) => e.data.$category);
    const sumCats = Object.fromEntries(
      _.map(Object.entries(grouped), entry => {
        const [group, events] = entry as [string, any[]];
        return [group.split(','), _.sumBy(events, 'duration')];
      })
    );
    alert_times.value = sumCats;
  } catch (e: any) {
    console.error(e);
    error.value = e.message || 'Bir hata oluştu.';
    return;
  }

  last_updated.value = new Date();
};

const fetchAnomalyAlerts = async () => {
  loadingAnomalies.value = true;
  try {
    const getAnomalyAlertsCallable = httpsCallable(functions, 'getAnomalyAlerts');
    const result = await getAnomalyAlertsCallable();
    anomalyAlerts.value = result.data as AnomalyAlert[];
  } catch (err) {
    console.error('Anomali uyarıları alınırken hata oluştu:', err);
    error.value = 'Anomali uyarıları yüklenemedi.';
  } finally {
    loadingAnomalies.value = false;
  }
};
</script>
