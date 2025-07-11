import { firestore } from 'firebase-admin';

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
} 