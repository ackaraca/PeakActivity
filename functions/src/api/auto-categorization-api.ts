import * as functions from 'firebase-functions';
import { AutoCategorizationService } from '../services/auto-categorization-service';

const autoCategorizationService = new AutoCategorizationService();

export const autoCategorize = functions.https.onCall(async (data, context) => {
  const { events } = data;

  if (!events || !Array.isArray(events)) {
    return { success: false, error: "Geçersiz giriş: 'events' dizisi gerekli." };
  }

  try {
    const result = autoCategorizationService.categorizeEvents(events);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Otomatik kategorizasyon sırasında hata oluştu:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Bilinmeyen bir hata oluştu:", error);
      return { success: false, error: "Bilinmeyen bir hata oluştu." };
    }
  }
}); 