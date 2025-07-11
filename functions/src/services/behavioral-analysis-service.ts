import { db } from "../firebaseAdmin";
import { ActivityEvent } from "../types/activity-event"; // ActivityEvent'ı içe aktar

interface RealtimeBehavioralPattern {
  user_id: string;
  timestamp: string; // Olayın zaman damgası
  pattern_type: 'idle_detection' | 'focus_shift' | 'high_activity' | 'low_activity' | 'unusual_category_use';
  description: string; // Tespit edilen örüntünün açıklaması
  confidence_score?: number; // Güven skoru (0-1 arası, ML entegrasyonu için)
  related_activity_id?: string; // İlgili aktivite olayının ID'si
  metadata?: { [key: string]: any }; // Ek meta veriler
  model_version: string; // Kullanılan modelin versiyonu
}

export class BehavioralAnalysisService {

  /**
   * Tekil bir aktivite olayı üzerinden gerçek zamanlı davranışsal örüntüleri analiz eder.
   * Bu fonksiyon, gelecekte daha gelişmiş makine öğrenimi modellerinin entegrasyonu için bir yer tutucudur.
   * Şimdilik basit kurallara dayalı tespitler yapar.
   * @param userId Kullanıcının ID'si.
   * @param event Analiz edilecek aktivite olayı.
   * @returns Tespit edilen örüntüleri içeren bir RealtimeBehavioralPattern nesnesi veya null.
   */
  public async analyzeRealtimeBehavioralPattern(userId: string, event: ActivityEvent): Promise<RealtimeBehavioralPattern | null> {
    // Gelecekteki makine öğrenimi modeli entegrasyon noktası.
    // Buraya TensorFlow.js veya başka bir ML modeli ile gerçek zamanlı sınıflandırma/tespit algoritmaları eklenebilir.
    // Örneğin, kullanıcının o anki aktivitesini geçmiş desenlerle karşılaştıran bir model.

    let pattern: RealtimeBehavioralPattern | null = null;
    const timestamp = new Date().toISOString(); // Anlık zaman damgası

    // Örnek: Yüksek AFK süresi tespiti
    if (event.is_afk && event.duration_sec > 300) { // 5 dakikadan fazla AFK
      pattern = {
        user_id: userId,
        timestamp: event.timestamp_start,
        pattern_type: 'idle_detection',
        description: `Kullanıcı ${Math.floor(event.duration_sec / 60)} dakikadan fazla süredir hareketsiz.`, // Türkçeleştirilmiş açıklama
        confidence_score: 0.8,
        related_activity_id: event.id, // Eğer ActivityEvent'ta id varsa
        model_version: "v1.0-rule-based",
      };
    }

    // Örnek: Odaklanma veya kategori değişimi tespiti (basit mantık)
    // Bu, art arda gelen iki etkinlik arasında büyük bir kategori veya uygulama değişikliği olup olmadığını kontrol edebilir.
    // Ancak, bu fonksiyon tek bir olayı işlediği için, bunun için bağlamı (önceki olayı) korumak gerekir.
    // Bu nedenle, bu tür senaryolar için ek bir durum yönetimi veya arka uçta bir akış işleme yaklaşımı gerekebilir.

    // ML entegrasyonu için yer tutucu:
    // const mlModelPrediction = await this.runMlModel(event);
    // if (mlModelPrediction.isAnomaly) {
    //   pattern = { ...mlModelPrediction, model_version: "v2.0-ml-powered" };
    // }

    return pattern;
  }

  /**
   * Bu fonksiyonun artık kullanılmadığını belirtmek için yeniden adlandırıldı.
   * Yeni gerçek zamanlı analiz için analyzeRealtimeBehavioralPattern kullanın.
   * @deprecated Artık kullanılmamaktadır. analyzeRealtimeBehavioralPattern kullanın.
   */
  public analyzeBehavioralPatterns(): never {
    throw new Error("analyzeBehavioralPatterns fonksiyonu artık kullanılmamaktadır. Lütfen analyzeRealtimeBehavioralPattern kullanın.");
  }

  /**
   * This is a placeholder for a future ML model.
   * @param event The activity event to analyze.
   * @returns A promise that resolves to an object indicating if an anomaly was detected.
   */
  private async runMlModel(event: ActivityEvent): Promise<{ isAnomaly: boolean; pattern_type?: string; description?: string; confidence_score?: number; }> {
    // Simulate ML model prediction
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    const isAnomaly = Math.random() > 0.9; // 10% chance of anomaly
    if (isAnomaly) {
      return {
        isAnomaly: true,
        pattern_type: 'unusual_activity',
        description: 'Makine öğrenimi modeli tarafından sıra dışı bir aktivite tespit edildi.',
        confidence_score: parseFloat(Math.random().toFixed(2)),
      };
    } else {
      return { isAnomaly: false };
    }
  }

  /**
   * Detects a consistent drop in activity on weekends.
   * This is a simplified rule-based detection for seasonality.
   * @deprecated Artık kullanılmamaktadır.
   */
  private detectWeekendDrop(): boolean {
    throw new Error("detectWeekendDrop fonksiyonu artık kullanılmamaktadır.");
  }
} 