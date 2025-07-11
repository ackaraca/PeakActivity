import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BehavioralAnalysisService } from '../services/behavioral-analysis-service';

const behavioralAnalysisService = new BehavioralAnalysisService();

export const analyzeBehavioralPatterns = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { dailyTotals, window } = request.data;

  if (!dailyTotals || !Array.isArray(dailyTotals)) {
    throw new HttpsError(
      'invalid-argument',
      'The dailyTotals array is required.'
    );
  }

  if (typeof window !== 'number' || window <= 0) {
    throw new HttpsError(
      'invalid-argument',
      'The window must be a positive number.'
    );
  }

  try {
    const result = behavioralAnalysisService.analyzeBehavioralPatterns(dailyTotals, window);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 