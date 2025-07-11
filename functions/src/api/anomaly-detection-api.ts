import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AnomalyDetectionService } from '../services/anomaly-detection-service';

const anomalyDetectionService = new AnomalyDetectionService();

export const detectAnomalies = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const dailyTotals = request.data.dailyTotals;

  if (!dailyTotals || !Array.isArray(dailyTotals)) {
    throw new HttpsError(
      'invalid-argument',
      'The dailyTotals array is required.'
    );
  }

  try {
    const result = anomalyDetectionService.detectAnomalies(dailyTotals);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 