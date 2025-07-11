import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AutomationRuleService } from '../services/automation-rule-service';

const automationRuleService = new AutomationRuleService();

// Create Automation Rule
export const createAutomationRule = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = context.auth.uid;
  const { ruleData } = data;

  if (!ruleData || !ruleData.name || !ruleData.trigger || !ruleData.action) {
    throw new functions.https.HttpsError('invalid-argument', 'Kural adı, tetikleyici ve eylem zorunludur.');
  }

  try {
    const ruleId = await automationRuleService.createRule(userId, ruleData);
    return { success: true, ruleId };
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', 'Kural oluşturulurken hata oluştu.', error.message);
    } else {
      throw new functions.https.HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Get Automation Rule by ID
export const getAutomationRule = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = context.auth.uid;
  const { ruleId } = data;

  if (!ruleId) {
    throw new functions.https.HttpsError('invalid-argument', 'Kural ID'si zorunludur.');
  }

  try {
    const rule = await automationRuleService.getRule(userId, ruleId);
    if (!rule) {
      throw new functions.https.HttpsError('not-found', 'Kural bulunamadı.');
    }
    return { success: true, rule };
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', 'Kural getirilirken hata oluştu.', error.message);
    } else {
      throw new functions.https.HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Get All Automation Rules for a user
export const getAllAutomationRules = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = context.auth.uid;

  try {
    const rules = await automationRuleService.getAllRules(userId);
    return { success: true, rules };
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', 'Kurallar getirilirken hata oluştu.', error.message);
    } else {
      throw new functions.https.HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Update Automation Rule
export const updateAutomationRule = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = context.auth.uid;
  const { ruleId, updates } = data;

  if (!ruleId || !updates) {
    throw new functions.https.HttpsError('invalid-argument', 'Kural ID'si ve güncellemeler zorunludur.');
  }

  try {
    await automationRuleService.updateRule(userId, ruleId, updates);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', 'Kural güncellenirken hata oluştu.', error.message);
    } else {
      throw new functions.https.HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Delete Automation Rule
export const deleteAutomationRule = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = context.auth.uid;
  const { ruleId } = data;

  if (!ruleId) {
    throw new functions.https.HttpsError('invalid-argument', 'Kural ID'si zorunludur.');
  }

  try {
    await automationRuleService.deleteRule(userId, ruleId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', 'Kural silinirken hata oluştu.', error.message);
    } else {
      throw new functions.https.HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
}); 