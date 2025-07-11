import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'time_based' | 'count_based' | 'habit_based' | 'milestone_based';
  targetDuration?: number; // seconds
  targetDailyDuration?: number; // seconds
  targetWeeklyDuration?: number; // seconds
  targetCount?: number;
  currentCount?: number;
  targetCriteria: {
    appNames?: string[];
    categories?: string[];
    tags?: string[];
  };
  progress: {
    currentDuration: number; // seconds
    currentStreak: number; // days
    longestStreak: number; // days
    lastUpdated: number; // timestamp
  };
  createdAt: number;
  updatedAt: number;
  version: number;
}

export class GoalService {
  /**
   * Yeni bir hedef oluşturur
   */
  static async createGoal(goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version' | 'progress'>, userId: string): Promise<Goal> {
    try {
      const newGoalRef = db.collection('users').doc(userId).collection('goals').doc();
      const newGoal: Goal = {
        id: newGoalRef.id,
        userId,
        ...goalData,
        progress: {
          currentDuration: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastUpdated: Date.now(),
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      await newGoalRef.set(newGoal);
      return newGoal;
    } catch (error: any) {
      throw new Error(`Hedef oluşturulurken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Bir hedefi ID'sine göre getirir
   */
  static async getGoal(goalId: string, userId: string): Promise<Goal | null> {
    try {
      const goalDoc = await db.collection('users').doc(userId).collection('goals').doc(goalId).get();
      if (!goalDoc.exists) {
        return null;
      }
      return goalDoc.data() as Goal;
    } catch (error: any) {
      throw new Error(`Hedef alınırken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Bir hedefi günceller
   */
  static async updateGoal(goalId: string, updates: Partial<Goal>, userId: string): Promise<void> {
    try {
      const goalRef = db.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.update({ ...updates, updatedAt: Date.now() });
    } catch (error: any) {
      throw new Error(`Hedef güncellenirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Bir hedefi siler
   */
  static async deleteGoal(goalId: string, userId: string): Promise<void> {
    try {
      const goalRef = db.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.delete();
    } catch (error: any) {
      throw new Error(`Hedef silinirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Bir kullanıcının tüm hedeflerini getirir
   */
  static async getAllGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsSnapshot = await db.collection('users').doc(userId).collection('goals').get();
      return goalsSnapshot.docs.map(doc => doc.data() as Goal);
    } catch (error: any) {
      throw new Error(`Hedefler alınırken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Hedef ilerlemesini kontrol eder ve günceller
   */
  static async checkGoalProgress(userId: string, activityData: any): Promise<any> {
    // TODO: Bu kısım activity türüne ve hedef türüne göre implement edilecek.
    // Örneğin: activityData.category, activityData.duration vs. kullanılarak ilgili hedefler bulunup güncellenecek.
    console.log(`Checking goal progress for user ${userId} with activity: ${JSON.stringify(activityData)}`);
    return {};
  }
} 