import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { AnalyticsService } from '../services/analytics-service';
import { NotificationService } from '../services/notification-service';
import { GoalService } from '../services/goal-service';

// Triggered when a new activity is added
export const onActivityCreated = onDocumentCreated(
  'users/{userId}/activities/{activityId}',
  async (event) => {
    const snapshot = event.data;
    const { userId, activityId } = event.params;
    
    if (!snapshot) {
      console.warn(`Activity not found: ${activityId}`);
      return;
    }

    const activityData = snapshot.data();
    
    try {
      // 1. Update focus score
      await AnalyticsService.updateUserFocusMetrics(userId, activityData);
      
      // 2. Check goal progress
      const goalUpdates = await GoalService.checkGoalProgress(
        userId, 
        activityData
      );
      
      // 3. Perform anomaly detection
      const anomalies = await AnalyticsService.detectAnomalies(
        userId, 
        activityData
      );
      
      // 4. Trigger notifications
      if (anomalies.length > 0) {
        await NotificationService.sendAnomalyNotifications(userId, anomalies);
      }
      
      if (goalUpdates && Object.keys(goalUpdates).length > 0) {
        await NotificationService.sendGoalProgressNotifications(
          userId, 
          goalUpdates
        );
      }
    } catch (error) {
      console.error(`Error processing activity creation (${activityId}):`, error);
    }
  }
); 