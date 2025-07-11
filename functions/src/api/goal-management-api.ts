
import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { GoalManagementService } from "../services/goal-management-service";

const goalService = new GoalManagementService();

/**
 * Firebase Function to create a new goal.
 */
export const createGoal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { title, description, type, target_duration, target_daily_duration, target_weekly_duration, target_count, current_count, target_criteria } = data;

  if (!title || !type || !target_criteria) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: başlık, tip, hedef kriterleri.');
  }

  try {
    const newGoal = await goalService.createGoal(userId, {
      title,
      description,
      type,
      target_duration,
      target_daily_duration,
      target_weekly_duration,
      target_count,
      current_count,
      target_criteria,
    });
    return { success: true, goal: newGoal };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific goal.
 */
export const getGoal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { goalId } = data;

  if (!goalId) {
    throw new HttpsError('invalid-argument', 'Hedef kimliği eksik.');
  }

  try {
    const goal = await goalService.getGoal(userId, goalId);
    if (!goal) {
      throw new HttpsError('not-found', 'Hedef bulunamadı.');
    }
    return { success: true, goal };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to update an existing goal.
 */
export const updateGoal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { goalId, updates } = data;

  if (!goalId || !updates) {
    throw new HttpsError('invalid-argument', 'Hedef kimliği veya güncellemeler eksik.');
  }

  try {
    const updatedGoal = await goalService.updateGoal(userId, goalId, updates);
    if (!updatedGoal) {
      throw new HttpsError('not-found', 'Güncellenecek hedef bulunamadı.');
    }
    return { success: true, goal: updatedGoal };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific goal.
 */
export const deleteGoal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;
  const { goalId } = data;

  if (!goalId) {
    throw new HttpsError('invalid-argument', 'Hedef kimliği eksik.');
  }

  try {
    const success = await goalService.deleteGoal(userId, goalId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek hedef bulunamadı.');
    }
    return { success: true, message: 'Hedef başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all goals for a user.
 */
export const listGoals = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = context.auth.uid;

  try {
    const goals = await goalService.listGoals(userId);
    return { success: true, goals };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
}); 