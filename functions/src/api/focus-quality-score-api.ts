import * as functions from 'firebase-functions';
import { FocusQualityScoreService } from '../services/focus-quality-score-service';

const focusQualityScoreService = new FocusQualityScoreService();

export const calculateFocusQualityScore = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { events, user_tz } = data;

  if (!events || !Array.isArray(events) || events.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The \'events\' array is required and cannot be empty.'
    );
  }
  if (typeof user_tz !== 'string' || user_tz.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The \'user_tz\' must be a valid timezone string.'
    );
  }

  try {
    const result = focusQualityScoreService.calculateFocusQualityScores(events, user_tz);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 