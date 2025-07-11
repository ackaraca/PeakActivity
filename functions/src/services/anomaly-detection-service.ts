import { db } from "../firebaseAdmin";

interface DailyTotal {
  date: string;
  total_seconds: number;
}

interface AnomalyResult {
  date: string;
  is_anomaly: boolean; // Anomalinin olup olmadığını belirten yeni alan
  anomaly_score?: number; // Anomali skoru (örneğin, 0-1 arası bir değer)
  deviation_percent?: number; // Sapma yüzdesi (isteğe bağlı)
  explanation?: string; // Anomaliye ilişkin açıklama veya içgörü
}

interface AnomalyOutput {
  anomalies: AnomalyResult[];
  baseline_mean?: number;
  baseline_stddev?: number;
  explanation: string;
  model_version: string; // Kullanılan modelin versiyonu
}

export class AnomalyDetectionService {
  /**
   * Calculates the mean of an array of numbers.
   * @param data The array of numbers.
   * @returns The mean.
   */
  private calculateMean(data: number[]): number {
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }

  /**
   * Calculates the standard deviation of an array of numbers.
   * @param data The array of numbers.
   * @param mean The pre-calculated mean of the data.
   * @returns The standard deviation.
   */
  private calculateStandardDeviation(data: number[], mean: number): number {
    const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
    const sumOfSquaredDifferences = squaredDifferences.reduce((acc, val) => acc + val, 0);
    return Math.sqrt(sumOfSquaredDifferences / data.length);
  }

  /**
   * Aktivite verilerinde gelişmiş anomali tespiti yapar.
   * Gelecekte bir makine öğrenimi (ML) modelini entegre etmek için bir yer tutucudur.
   * Şimdilik, basit bir istatistiksel yöntem kullanır ve ML entegrasyonu için bir iskelet sağlar.
   * @param dailyTotals Günlük aktivite toplamlarını içeren bir dizi.
   * @returns Tespit edilen anomalileri ve model istatistiklerini içeren bir AnomalyOutput nesnesi.
   */
  public detectAnomalies(dailyTotals: DailyTotal[]): AnomalyOutput {
    const totalSecondsValues = dailyTotals.map(d => d.total_seconds);

    if (totalSecondsValues.length < 5) { // Gelişmiş model için daha fazla veri varsayımı
      return {
        anomalies: [],
        baseline_mean: 0,
        baseline_stddev: 0,
        explanation: "Anomali tespiti için yeterli veri yok. En az 5 günlük veri gereklidir. Gelişmiş anomali tespiti için daha fazla veri önerilir.",
        model_version: "v1.0-statistical"
      };
    }

    // Burası, gelecekte TensorFlow.js veya başka bir ML modeli entegrasyon noktası olacaktır.
    // Örneğin, zaman serisi analizi veya kümeleme algoritmaları burada çalışabilir.
    // Şimdilik, mevcut istatistiksel yöntemi koruyalım ama yapıyı ML uyumlu hale getirelim.

    const mean = this.calculateMean(totalSecondsValues);
    const stdDev = this.calculateStandardDeviation(totalSecondsValues, mean);

    const anomalies: AnomalyResult[] = [];

    for (const dailyTotal of dailyTotals) {
      let isAnomaly = false;
      let anomalyScore = 0;
      let deviationPercent = 0;
      let explanationText = "";

      if (stdDev === 0) {
        if (dailyTotal.total_seconds !== mean) {
          isAnomaly = true;
          anomalyScore = 1.0; // Yüksek anomali skoru
          deviationPercent = ((dailyTotal.total_seconds - mean) / (mean || 1)) * 100; // mean 0 ise bölme hatasını önle
          explanationText = "Tüm değerler aynıyken farklı bir aktivite tespit edildi.";
        }
      } else {
        const zScore = (dailyTotal.total_seconds - mean) / stdDev;
        if (Math.abs(zScore) >= 2) { // Z-skoru eşiği (ayarlanabilir)
          isAnomaly = true;
          anomalyScore = Math.min(1.0, Math.abs(zScore) / 3); // Skoru 0-1 arasına normalize etmeye çalış
          deviationPercent = ((dailyTotal.total_seconds - mean) / mean) * 100;
          explanationText = `Aykırı aktivite tespit edildi: ${deviationPercent.toFixed(2)}% sapma (Z-skoru: ${zScore.toFixed(2)}).`;
        }
      }

      if (isAnomaly) {
        anomalies.push({
          date: dailyTotal.date,
          is_anomaly: true,
          anomaly_score: parseFloat(anomalyScore.toFixed(2)),
          deviation_percent: parseFloat(deviationPercent.toFixed(2)),
          explanation: explanationText,
        });
      }
    }

    anomalies.sort((a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0)); // Skora göre sırala

    return {
      anomalies: anomalies.slice(0, 10),
      baseline_mean: parseFloat(mean.toFixed(2)),
      baseline_stddev: parseFloat(stdDev.toFixed(2)),
      explanation: anomalies.length > 0 ? "Belirlenen aktivite verilerinde anormal günler tespit edildi." : "Anormal aktivite verisi tespit edilmedi.",
      model_version: "v1.0-statistical-improved" // Model versiyonunu güncelle
    };
  }
} 