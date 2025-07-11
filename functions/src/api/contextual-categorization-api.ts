import * as functions from 'firebase-functions';
import { ContextualCategorizationService } from '../services/contextual-categorization-service';

const contextualCategorizationService = new ContextualCategorizationService();

export const categorizeContext = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { context: textContext, language } = data;

  if (typeof textContext !== 'string' || textContext.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The 'context' must be a non-empty string.'
    );
  }
  // Dil parametresi isteğe bağlı olduğundan, burada zorunlu kontrol yapmıyoruz.

  try {
    const result = contextualCategorizationService.categorizeContext({ context: textContext, language });
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 