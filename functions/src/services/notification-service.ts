
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface NotificationDocument {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'goal_progress' | 'insight_available' | 'automation_trigger';
  read: boolean;
  timestamp: number;
  action_link?: string;
  related_entity_id?: string;
  version: number;
}

export class NotificationService {
  /**
   * Creates a new notification for a user.
   * @param userId The ID of the user.
   * @param notificationData The data for the new notification.
   * @returns The created notification document.
   */
  async createNotification(userId: string, notificationData: Omit<NotificationDocument, 'id' | 'user_id' | 'timestamp' | 'version' | 'read'>): Promise<NotificationDocument> {
    const newNotificationRef = db.collection(`users/${userId}/notifications`).doc();
    const timestamp = Date.now();
    const notification: NotificationDocument = {
      id: newNotificationRef.id,
      user_id: userId,
      ...notificationData,
      read: false, // Default to unread
      timestamp: timestamp,
      version: 1,
    };
    await newNotificationRef.set(notification);
    return notification;
  }

  /**
   * Retrieves a specific notification for a user.
   * @param userId The ID of the user.
   * @param notificationId The ID of the notification to retrieve.
   * @returns The notification document, or null if not found.
   */
  async getNotification(userId: string, notificationId: string): Promise<NotificationDocument | null> {
    const notificationDoc = await db.collection(`users/${userId}/notifications`).doc(notificationId).get();
    if (!notificationDoc.exists) {
      return null;
    }
    return notificationDoc.data() as NotificationDocument;
  }

  /**
   * Updates an existing notification for a user.
   * @param userId The ID of the user.
   * @param notificationId The ID of the notification to update.
   * @param updates The fields to update.
   * @returns The updated notification document, or null if not found.
   */
  async updateNotification(userId: string, notificationId: string, updates: Partial<Omit<NotificationDocument, 'id' | 'user_id' | 'timestamp'>>): Promise<NotificationDocument | null> {
    const notificationRef = db.collection(`users/${userId}/notifications`).doc(notificationId);
    await notificationRef.update(updates);
    const updatedDoc = await notificationRef.get();
    if (!updatedDoc.exists) {
      return null;
    }
    return updatedDoc.data() as NotificationDocument;
  }

  /**
   * Deletes a specific notification for a user.
   * @param userId The ID of the user.
   * @param notificationId The ID of the notification to delete.
   * @returns True if the notification was deleted, false otherwise.
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const notificationRef = db.collection(`users/${userId}/notifications`).doc(notificationId);
    await notificationRef.delete();
    const doc = await notificationRef.get();
    return !doc.exists;
  }

  /**
   * Lists all notifications for a user.
   * @param userId The ID of the user.
   * @returns An array of notification documents.
   */
  async listNotifications(userId: string): Promise<NotificationDocument[]> {
    const snapshot = await db.collection(`users/${userId}/notifications`).orderBy('timestamp', 'desc').get();
    return snapshot.docs.map(doc => doc.data() as NotificationDocument);
  }
} 