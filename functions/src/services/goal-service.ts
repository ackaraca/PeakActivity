import { admin } from '../config/firebase-admin';
import { AppError, ValidationError, NotFoundError } from '../utils/error-handler';

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
  static async createGoal(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'progress'>, userId: string): Promise<Goal> {
    try {
      const newGoalRef = admin.firestore.collection('users').doc(userId).collection('goals').doc();
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
    } catch (error) {
      throw new AppError('Hedef oluşturulurken hata oluştu', 'GOAL_CREATION_FAILED', 500, false, error);
    }
  }

  /**
   * Bir hedefi ID'sine göre getirir
   */
  static async getGoal(goalId: string, userId: string): Promise<Goal | null> {
    try {
      const goalDoc = await admin.firestore.collection('users').doc(userId).collection('goals').doc(goalId).get();
      if (!goalDoc.exists) {
        return null;
      }
      return goalDoc.data() as Goal;
    } catch (error) {
      throw new AppError('Hedef alınırken hata oluştu', 'GOAL_FETCH_FAILED', 500, false, error);
    }
  }

  /**
   * Bir hedefi günceller
   */
  static async updateGoal(goalId: string, updates: Partial<Goal>, userId: string): Promise<void> {
    try {
      const goalRef = admin.firestore.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.update({ ...updates, updatedAt: Date.now() });
    } catch (error) {
      throw new AppError('Hedef güncellenirken hata oluştu', 'GOAL_UPDATE_FAILED', 500, false, error);
    }
  }

  /**
   * Bir hedefi siler
   */
  static async deleteGoal(goalId: string, userId: string): Promise<void> {
    try {
      const goalRef = admin.firestore.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.delete();
    } catch (error) {
      throw new AppError('Hedef silinirken hata oluştu', 'GOAL_DELETION_FAILED', 500, false, error);
    }
  }

  /**
   * Bir kullanıcının tüm hedeflerini getirir
   */
  static async getAllGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsSnapshot = await admin.firestore.collection('users').doc(userId).collection('goals').get();
      return goalsSnapshot.docs.map(doc => doc.data() as Goal);
    } catch (error) {
      throw new AppError('Hedefler alınırken hata oluştu', 'GOALS_FETCH_FAILED', 500, false, error);
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