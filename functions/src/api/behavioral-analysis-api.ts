import * as functions from 'firebase-functions';
import { BehavioralAnalysisService } from '../services/behavioral-analysis-service';

const behavioralAnalysisService = new BehavioralAnalysisService();

export const analyzeBehavioralPatterns = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { dailyTotals, window } = data;

  if (!dailyTotals || !Array.isArray(dailyTotals)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The dailyTotals array is required.'
    );
  }

  if (typeof window !== 'number' || window <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The window must be a positive number.'
    );
  }

  try {
    const result = behavioralAnalysisService.analyzeBehavioralPatterns(dailyTotals, window);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 