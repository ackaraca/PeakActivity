import * as functions from 'firebase-functions';
import { CommunityRulesService } from '../services/community-rules-service';

const communityRulesService = new CommunityRulesService();

export const matchCommunityRule = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { event, communityRules } = data;

  if (!event) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The \'event\' object is required.'
    );
  }
  if (!communityRules || !Array.isArray(communityRules)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The \'communityRules\' array is required.'
    );
  }

  try {
    const result = communityRulesService.matchCommunityRule(event, communityRules);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 