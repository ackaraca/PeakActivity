import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ActivityService } from '../services/activity-service';

const activityService = new ActivityService();

export const saveActivity = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const userId = request.auth.uid;
  const activityData = request.data.activityData;

  if (!activityData) {
    throw new HttpsError(
      'invalid-argument',
      'The activityData is required.'
    );
  }

  try {
    const result = await activityService.saveActivity(userId, activityData);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 