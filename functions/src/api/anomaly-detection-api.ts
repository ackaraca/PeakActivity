import * as functions from 'firebase-functions';
import { AnomalyDetectionService } from '../services/anomaly-detection-service';

const anomalyDetectionService = new AnomalyDetectionService();

export const detectAnomalies = functions.https.onCall(async (data, context) => {
  // TODO: Gerçek veritabanından günlük toplamları al. Şimdilik mock veri kullanılıyor.
  const dailyTotals = await anomalyDetectionService.getDailyTotals();

  try {
    const result = anomalyDetectionService.detectAnomalies(dailyTotals);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Anomali tespiti sırasında hata oluştu:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Bilinmeyen bir hata oluştu:", error);
      return { success: false, error: "Bilinmeyen bir hata oluştu." };
    }
  }
}); 