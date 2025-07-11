import * as functions from 'firebase-functions';
import { FocusQualityScoreService } from '../services/focus-quality-score-service';

const focusQualityScoreService = new FocusQualityScoreService();

export const calculateFocusQualityScore = functions.https.onCall(async (data, context) => {
  const { events, user_tz } = data;

  if (!events || !Array.isArray(events) || events.length === 0) {
    return { success: false, error: "Geçersiz giriş: 'events' dizisi gerekli ve boş olmamalı." };
  }
  if (typeof user_tz !== 'string' || user_tz.trim() === '') {
    return { success: false, error: "Geçersiz giriş: 'user_tz' geçerli bir zaman dilimi olmalı." };
  }

  try {
    // Gerçek uygulamada events veritabanından alınacak. Şimdilik mock veri kullanılıyor.
    // const activityEvents = await focusQualityScoreService.getMockActivityEvents();
    const result = focusQualityScoreService.calculateFocusQualityScores(events, user_tz);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Odak kalitesi skoru hesaplama sırasında hata oluştu:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Bilinmeyen bir hata oluştu:", error);
      return { success: false, error: "Bilinmeyen bir hata oluştu." };
    }
  }
}); 