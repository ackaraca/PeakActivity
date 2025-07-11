import * as functions from 'firebase-functions';
import { BehavioralAnalysisService } from '../services/behavioral-analysis-service';

const behavioralAnalysisService = new BehavioralAnalysisService();

export const analyzeBehavioralPatterns = functions.https.onCall(async (data, context) => {
  const { window } = data;

  if (typeof window !== 'number' || window <= 0) {
    return { success: false, error: "Geçersiz giriş: 'window' pozitif bir sayı olmalı." };
  }

  try {
    const dailyTotals = await behavioralAnalysisService.getDailyCategoryTotals(window);
    const result = behavioralAnalysisService.analyzeBehavioralPatterns(dailyTotals, window);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Davranışsal analiz sırasında hata oluştu:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Bilinmeyen bir hata oluştu:", error);
      return { success: false, error: "Bilinmeyen bir hata oluştu." };
    }
  }
}); 