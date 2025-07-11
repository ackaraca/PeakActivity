import * as functions from 'firebase-functions';
import { CommunityRulesService } from '../services/community-rules-service';

const communityRulesService = new CommunityRulesService();

export const matchCommunityRule = functions.https.onCall(async (data, context) => {
  const { event, communityRules } = data;

  if (!event) {
    return { success: false, error: "Geçersiz giriş: 'event' nesnesi gerekli." };
  }

  try {
    const result = communityRulesService.matchCommunityRule(event, communityRules);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Topluluk kuralı eşleştirme sırasında hata oluştu:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Bilinmeyen bir hata oluştu:", error);
      return { success: false, error: "Bilinmeyen bir hata oluştu." };
    }
  }
}); 