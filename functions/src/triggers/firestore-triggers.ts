import { onDocumentCreated } from 'firebase-functions/v2/firestore';
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
      // Yeni etkinlik oluşturulduğunda bildirim gönder
      await new NotificationService().createNotification(userId, {
        title: 'Yeni Aktivite Eklendi',
        message: `Yeni bir aktivite kaydedildi: ${activityData.title || 'Bilinmeyen Aktivite'}.`, // Aktivite başlığına göre mesajı kişiselleştir
        type: 'info',
        related_entity_id: activityId,
      });

      // 1. Update focus score (AnalyticsService kaldırıldı, ilgili servis çağrısı gerekiyorsa buraya eklenecek)
      // await AnalyticsService.updateUserFocusMetrics(userId, activityData);
      
      // 2. Check goal progress
      const goalUpdates = await GoalService.checkGoalProgress(
        userId, 
        activityData
      );
      
      // 3. Perform anomaly detection (AnalyticsService kaldırıldı, ilgili servis çağrısı gerekiyorsa buraya eklenecek)
      const anomalies: any[] = []; // Geçici olarak boş dizi, anomali tespiti yeniden implement edilmeli
      // const anomalies = await AnalyticsService.detectAnomalies(
      //   userId, 
      //   activityData
      // );
      
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