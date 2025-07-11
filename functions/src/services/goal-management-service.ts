
import * as functions from "firebase-functions";
import { db } from "../firebaseAdmin";

interface GoalDocument {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: 'time_based' | 'count_based' | 'habit_based' | 'milestone_based';
  target_duration?: number;
  target_daily_duration?: number;
  target_weekly_duration?: number;
  target_count?: number;
  current_count?: number;
  target_criteria: {
    app_names?: string[];
    categories?: string[];
    tags?: string[];
  };
  progress: {
    current_duration: number;
    current_streak: number;
    longest_streak: number;
    last_updated: number;
  };
  created_at: number;
  updated_at: number;
  version: number;
}

export class GoalManagementService {
  /**
   * Creates a new goal for a user.
   * @param userId The ID of the user.
   * @param goalData The data for the new goal.
   * @returns The created goal document.
   */
  async createGoal(userId: string, goalData: Omit<GoalDocument, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>): Promise<GoalDocument> {
    const newGoalRef = db.collection(`users/${userId}/goals`).doc();
    const timestamp = Date.now();
    const goal: GoalDocument = {
      id: newGoalRef.id,
      user_id: userId,
      ...goalData,
      progress: {
        current_duration: 0,
        current_streak: 0,
        longest_streak: 0,
        last_updated: timestamp,
      },
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    };
    await newGoalRef.set(goal);
    return goal;
  }

  /**
   * Retrieves a specific goal for a user.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to retrieve.
   * @returns The goal document, or null if not found.
   */
  async getGoal(userId: string, goalId: string): Promise<GoalDocument | null> {
    const goalDoc = await db.collection(`users/${userId}/goals`).doc(goalId).get();
    if (!goalDoc.exists) {
      return null;
    }
    return goalDoc.data() as GoalDocument;
  }

  /**
   * Updates an existing goal for a user.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to update.
   * @param updates The fields to update.
   * @returns The updated goal document, or null if not found.
   */
  async updateGoal(userId: string, goalId: string, updates: Partial<Omit<GoalDocument, 'id' | 'user_id' | 'created_at'>>): Promise<GoalDocument | null> {
    const goalRef = db.collection(`users/${userId}/goals`).doc(goalId);
    const timestamp = Date.now();
    await goalRef.update({
      ...updates,
      updated_at: timestamp,
    });
    const updatedDoc = await goalRef.get();
    if (!updatedDoc.exists) {
      return null;
    }
    return updatedDoc.data() as GoalDocument;
  }

  /**
   * Deletes a specific goal for a user.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to delete.
   * @returns True if the goal was deleted, false otherwise.
   */
  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const goalRef = db.collection(`users/${userId}/goals`).doc(goalId);
    await goalRef.delete();
    const doc = await goalRef.get();
    return !doc.exists;
  }

  /**
   * Lists all goals for a user.
   * @param userId The ID of the user.
   * @returns An array of goal documents.
   */
  async listGoals(userId: string): Promise<GoalDocument[]> {
    const snapshot = await db.collection(`users/${userId}/goals`).get();
    return snapshot.docs.map(doc => doc.data() as GoalDocument);
  }
} 