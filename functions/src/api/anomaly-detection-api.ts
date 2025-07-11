import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AnomalyDetectionService } from '../services/anomaly-detection-service';
import { AINotificationService } from '../services/ai-notification-service';

const anomalyDetectionService = new AnomalyDetectionService();
const aiNotificationService = new AINotificationService();

export const detectAnomalies = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const userId = request.auth.uid; // Kullanıcı ID'sini al
  const dailyTotals = request.data.dailyTotals;

  if (!dailyTotals || !Array.isArray(dailyTotals)) {
    throw new HttpsError(
      'invalid-argument',
      'The dailyTotals array is required.'
    );
  }

  try {
    const result = anomalyDetectionService.detectAnomalies(dailyTotals);

    // Anomali tespit edildiyse bildirim gönder
    if (result.anomalies.length > 0) {
      const latestAnomaly = result.anomalies[0]; // En son veya en önemli anomaliden bildirim gönder
      const title = "Anomali Tespit Edildi!";
      const body = `Aktivite verilerinizde bir anormallik tespit edildi: ${latestAnomaly.date} tarihinde Z-skor: ${latestAnomaly.z_score}, Sapma: ${latestAnomaly.deviation_percent}%.`;
      
      // Bildirimi Firebase Cloud Messaging (FCM) aracılığıyla gönder
      // Bu kısım arka planda çalışacağı için await kullanmak önemlidir.
      await aiNotificationService.sendAIRecommendationNotification(userId, title, body, { 
        anomalyDate: latestAnomaly.date, 
        zScore: latestAnomaly.z_score.toString(), 
        deviationPercent: latestAnomaly.deviation_percent.toString() 
      });

      console.log(`Kullanıcı ${userId} için anomali bildirimi gönderildi.`);
    }

    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 