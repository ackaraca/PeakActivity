import * as functions from 'firebase-functions';
import { parseISO, differenceInSeconds, getHours, setHours, setMinutes, setSeconds } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

interface ActivityEvent {
  timestamp_start: string;
  timestamp_end: string;
  duration_sec: number;
  app: string;
  title: string;
  category: string;
  window_change_count: number;
  input_frequency: number;
  is_afk: boolean;
}

interface SessionScore {
  session_id: string;
  focus_quality_score: number;
  distractions: number;
  context_switch_penalty: number;
}

interface FocusQualityScoreOutput {
  session_scores: SessionScore[];
  daily_average: number;
  explanations: string;
}

export class FocusQualityScoreService {

  /**
   * Tek bir oturum için odak kalitesi skorunu hesaplar.
   * @param sessionEvents Oturuma ait etkinlikler.
   * @param userTimeZone Kullanıcının zaman dilimi.
   * @returns Hesaplanan oturum skoru.
   */
  private calculateSessionScore(sessionEvents: ActivityEvent[], userTimeZone: string): SessionScore | null {
    if (sessionEvents.length === 0) {
      return null;
    }

    const firstEvent = sessionEvents[0];
    const lastEvent = sessionEvents[sessionEvents.length - 1];

    // Oturumun başlangıç ve bitiş zamanlarını al
    const sessionStart = parseISO(firstEvent.timestamp_start);
    const sessionEnd = parseISO(lastEvent.timestamp_end);

    // 1. Temel puanlama: Kesintisiz non-AFK süresi ≥ 5 dakika
    let baseScore = 100;
    const sessionDurationMinutes = differenceInSeconds(sessionEnd, sessionStart) / 60;
    if (sessionDurationMinutes < 5 || sessionEvents.some(event => event.is_afk)) {
      return null; // Nitelikli bir oturum değil
    }

    // 2. Bağlam geçişi (pencere/uygulama değişikliği) başına -1 puan (ilkten sonra)
    let contextSwitchPenalty = 0;
    let distractions = 0;
    if (sessionEvents.length > 1) {
      for (let i = 1; i < sessionEvents.length; i++) {
        if (sessionEvents[i].app !== sessionEvents[i - 1].app || sessionEvents[i].title !== sessionEvents[i - 1].title) {
          contextSwitchPenalty += 1;
          distractions += 1;
        }
      }
    }
    baseScore -= contextSwitchPenalty;

    // 3. input_frequency < 0.1 olan her dakika için -0.5 puan (pasif tüketim)
    let passiveConsumptionPenalty = 0;
    for (const event of sessionEvents) {
      if (event.input_frequency < 0.1) {
        passiveConsumptionPenalty += (event.duration_sec / 60) * 0.5;
      }
    }
    baseScore -= passiveConsumptionPenalty;

    // 4. Oturumda herhangi bir sosyal medya kategorisi uygulaması kullanılıyorsa -10 puan
    const socialMediaCategories = ['social', 'gaming', 'entertainment']; // Tanımdan farklı, daha geniş bir sosyal medya tanımı
    if (sessionEvents.some(event => socialMediaCategories.includes(event.category)))
    {
      baseScore -= 10;
      distractions += 1; // Sosyal medya kullanımı da bir dikkat dağıtıcıdır
    }

    // 5. Yerel saate göre 09:00-12:00 arasındaki oturumlar için +5 puan, 00:00-06:00 arası için -5 puan
    const zonedSessionStart = utcToZonedTime(sessionStart, userTimeZone);
    const startHour = getHours(zonedSessionStart);

    const nineAm = getHours(utcToZonedTime(setHours(setMinutes(setSeconds(new Date(), 0), 0), 9), userTimeZone));
    const twelvePm = getHours(utcToZonedTime(setHours(setMinutes(setSeconds(new Date(), 0), 0), 12), userTimeZone));
    const midnight = getHours(utcToZonedTime(setHours(setMinutes(setSeconds(new Date(), 0), 0), 0), userTimeZone));
    const sixAm = getHours(utcToZonedTime(setHours(setMinutes(setSeconds(new Date(), 0), 0), 6), userTimeZone));

    if (startHour >= nineAm && startHour < twelvePm) {
      baseScore += 5;
    } else if (startHour >= midnight && startHour < sixAm) {
      baseScore -= 5;
    }

    // 6. Puanları 0-100 aralığına sabitle
    const finalScore = Math.max(0, Math.min(100, baseScore));

    return {
      session_id: `${firstEvent.timestamp_start}-${lastEvent.timestamp_end}`,
      focus_quality_score: parseFloat(finalScore.toFixed(0)),
      distractions: distractions,
      context_switch_penalty: contextSwitchPenalty,
    };
  }

  /**
   * Aktivite etkinliklerinden odak kalitesi skorlarını hesaplar.
   * @param events Aktivite etkinlikleri dizisi.
   * @param userTimeZone Kullanıcının zaman dilimi.
   * @returns Hesaplanan odak kalitesi skorlarını içeren çıktı nesnesi.
   */
  public calculateFocusQualityScores(events: ActivityEvent[], userTimeZone: string): FocusQualityScoreOutput {
    const sessionScores: SessionScore[] = [];
    let currentSession: ActivityEvent[] = [];

    // Etkinlikleri kronolojik sıraya göre sırala (gerekliyse)
    events.sort((a, b) => new Date(a.timestamp_start).getTime() - new Date(b.timestamp_start).getTime());

    for (const event of events) {
      if (currentSession.length === 0) {
        currentSession.push(event);
      } else {
        const lastEventInSession = currentSession[currentSession.length - 1];
        // Eğer etkinlik, önceki oturumun bitişinden 5 dakikadan daha az bir süre sonra başlıyorsa aynı oturumda kabul et
        const gap = differenceInSeconds(parseISO(event.timestamp_start), parseISO(lastEventInSession.timestamp_end));
        if (gap <= 300) { // 5 dakika = 300 saniye
          currentSession.push(event);
        } else {
          const score = this.calculateSessionScore(currentSession, userTimeZone);
          if (score) {
            sessionScores.push(score);
          }
          currentSession = [event];
        }
      }
    }

    // Son oturumu ekle
    const score = this.calculateSessionScore(currentSession, userTimeZone);
    if (score) {
      sessionScores.push(score);
    }

    const totalScores = sessionScores.map(s => s.focus_quality_score);
    const dailyAverage = totalScores.length > 0 
      ? parseFloat((totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length).toFixed(0)) 
      : 0;

    let explanations = "Odak kalitesi analizi tamamlandı.";
    if (sessionScores.length === 0) {
      explanations = "Nitelikli odak oturumu bulunamadı.";
    }

    return {
      session_scores: sessionScores,
      daily_average: dailyAverage,
      explanations: explanations,
    };
  }

  /**
   * Mock aktivite etkinlik verilerini döndürür.
   * Gerçek uygulamada, bu Firestore'dan verileri çekecektir.
   * @returns ActivityEvent nesnelerinin bir dizisine çözümleyen bir Promise.
   */
  public async getMockActivityEvents(): Promise<ActivityEvent[]> {
    // Mock data for demonstration
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            timestamp_start: "2023-07-20T09:00:00Z",
            timestamp_end: "2023-07-20T09:30:00Z",
            duration_sec: 1800,
            app: "Visual Studio Code",
            title: "index.ts",
            category: "coding",
            window_change_count: 2,
            input_frequency: 0.9,
            is_afk: false,
          },
          {
            timestamp_start: "2023-07-20T09:30:01Z",
            timestamp_end: "2023-07-20T10:00:00Z",
            duration_sec: 1799,
            app: "Visual Studio Code",
            title: "app.js",
            category: "coding",
            window_change_count: 1,
            input_frequency: 0.8,
            is_afk: false,
          },
          {
            timestamp_start: "2023-07-20T10:05:00Z",
            timestamp_end: "2023-07-20T10:15:00Z",
            duration_sec: 600,
            app: "Discord",
            title: "#general",
            category: "social",
            window_change_count: 0,
            input_frequency: 0.2,
            is_afk: false,
          },
          {
            timestamp_start: "2023-07-20T10:15:01Z",
            timestamp_end: "2023-07-20T10:20:00Z",
            duration_sec: 299,
            app: "Visual Studio Code",
            title: "main.ts",
            category: "coding",
            window_change_count: 0,
            input_frequency: 0.7,
            is_afk: false,
          },
          {
            timestamp_start: "2023-07-20T14:00:00Z",
            timestamp_end: "2023-07-20T14:30:00Z",
            duration_sec: 1800,
            app: "Chrome",
            title: "Netflix",
            category: "entertainment",
            window_change_count: 5,
            input_frequency: 0.05,
            is_afk: false,
          },
          {
            timestamp_start: "2023-07-20T05:00:00Z",
            timestamp_end: "2023-07-20T05:10:00Z",
            duration_sec: 600,
            app: "CodingApp",
            title: "early_code.py",
            category: "coding",
            window_change_count: 1,
            input_frequency: 0.7,
            is_afk: false,
          },
          {
            timestamp_start: "2023-07-20T05:10:01Z",
            timestamp_end: "2023-07-20T05:16:00Z", // 6 dakikalık AFK
            duration_sec: 359,
            app: "CodingApp",
            title: "early_code.py",
            category: "coding",
            window_change_count: 0,
            input_frequency: 0,
            is_afk: true,
          },
        ]);
      }, 500);
    });
  }
} 