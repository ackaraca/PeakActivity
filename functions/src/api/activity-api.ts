import * as functions from 'firebase-functions';
import { ActivityService } from '../services/activity-service';

const activityService = new ActivityService();

export const saveActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const userId = context.auth.uid;
  const activityData = data.activityData;

  if (!activityData) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The activityData is required.'
    );
  }

  try {
    const result = await activityService.saveActivity(userId, activityData);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 