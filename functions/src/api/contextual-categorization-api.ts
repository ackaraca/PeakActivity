import * as functions from 'firebase-functions';
import { ContextualCategorizationService } from '../services/contextual-categorization-service';

const contextualCategorizationService = new ContextualCategorizationService();

export const categorizeContext = functions.https.onCall(async (data, context) => {
  const { context: textContext, language } = data;

  if (typeof textContext !== 'string' || textContext.trim() === '') {
    return { success: false, error: "Geçersiz giriş: 'context' bir metin olmalı ve boş olmamalı." };
  }

  try {
    const result = contextualCategorizationService.categorizeContext({ context: textContext, language });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Bağlamsal kategorizasyon sırasında hata oluştu:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Bilinmeyen bir hata oluştu:", error);
      return { success: false, error: "Bilinmeyen bir hata oluştu." };
    }
  }
}); 