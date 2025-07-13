import { firestore } from 'firebase-admin';
import { ActivityEvent } from '../types/activity-event';

export class ActivityService {
  private db: firestore.Firestore;

  constructor() {
    this.db = firestore();
  }

  async saveActivity(userId: string, activityData: any) {
    try {
      const activityRef = this.db.collection(`users/${userId}/activities`).doc();
      await activityRef.set({
        ...activityData,
        id: activityRef.id,
        user_id: userId,
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, activityId: activityRef.id };
    } catch (error) {
      console.error("Error saving activity:", error);
      throw new Error("Failed to save activity.");
    }
  }

  /**
   * Belirli bir zaman aralığındaki kullanıcı aktivitelerini getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param startDate Getirilecek aktivitelerin başlangıç zamanı (ISO string).
   * @param endDate Getirilecek aktivitelerin bitiş zamanı (ISO string).
   * @returns Aktivite verileri listesi.
   */
  async getActivitiesInInterval(userId: string, startDate: string, endDate: string) {
    try {
      const activitiesRef = this.db.collection(`users/${userId}/activities`);
      const snapshot = await activitiesRef
        .where('timestamp_start', '>=', startDate)
        .where('timestamp_start', '<=', endDate)
        .orderBy('timestamp_start')
        .get();

      return snapshot.docs.map(doc => doc.data() as ActivityEvent);
    } catch (error) {
      console.error("Error getting activities in interval:", error);
      throw new Error("Failed to get activities in interval.");
    }
  }
} 