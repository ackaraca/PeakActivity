import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ContextualCategorizationService } from '../services/contextual-categorization-service';

const contextualCategorizationService = new ContextualCategorizationService();

export const categorizeContext = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { context: textContext, language } = request.data;

  if (typeof textContext !== 'string' || textContext.trim() === '') {
    throw new HttpsError(
      'invalid-argument',
      "The 'context' must be a non-empty string."
    );
  }
  // Dil parametresi isteğe bağlı olduğundan, burada zorunlu kontrol yapmıyoruz.

  try {
    const result = contextualCategorizationService.categorizeContext({ context: textContext, language });
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError(
      'internal',
      error.message || 'An unknown error occurred.'
    );
  }
}); 