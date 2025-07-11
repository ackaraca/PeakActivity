import * as functions from 'firebase-functions';

interface ContextualCategorizationInput {
  context: string;
  language?: string; // ISO 639-1 kodu (örn: "en", "tr")
}

interface ContextualCategorizationOutput {
  category: string;
  confidence: number;
  rationale: string;
}

export class ContextualCategorizationService {
  private readonly LABELS = [
    'coding',
    'design',
    'research',
    'social',
    'news',
    'entertainment',
    'communication',
    'shopping',
  ];

  // Basit bir anahtar kelime tabanlı sınıflandırma simülasyonu
  private readonly KEYWORD_CATEGORIES: { [key: string]: string } = {
    'css': 'coding',
    'html': 'coding',
    'javascript': 'coding',
    'python': 'coding',
    'code': 'coding',
    'figma': 'design',
    'photoshop': 'design',
    'design': 'design',
    'ux': 'design',
    'wiki': 'research',
    'article': 'research',
    'study': 'research',
    'facebook': 'social',
    'twitter': 'social',
    'instagram': 'social',
    'cnn': 'news',
    'bbc': 'news',
    'haber': 'news',
    'movie': 'entertainment',
    'film': 'entertainment',
    'youtube': 'entertainment',
    'netflix': 'entertainment',
    'slack': 'communication',
    'email': 'communication',
    'zoom': 'communication',
    'shop': 'shopping',
    'buy': 'shopping',
    'amazon': 'shopping',
  };

  /**
   * Bağlamsal bilgiyi kullanarak kategorizasyon yapar.
   * @param input Kategorize edilecek bağlam ve dil bilgisi.
   * @returns Kategorizasyon sonucunu içeren çıktı nesnesi.
   */
  public categorizeContext(input: ContextualCategorizationInput): ContextualCategorizationOutput {
    const text = input.context.toLowerCase();
    let detectedCategory: string | null = null;
    let rationale = "";

    // Basit dil algılama ve çeviri simülasyonu (şimdilik sadece İngilizce varsayımı)
    // Gerçek bir senaryoda, LLM tabanlı bir çeviri hizmeti kullanılabilir.
    const processedText = text; 

    for (const keyword in this.KEYWORD_CATEGORIES) {
      if (processedText.includes(keyword)) {
        detectedCategory = this.KEYWORD_CATEGORIES[keyword];
        rationale = `Anahtar kelime içeriyor: ${keyword}, ${detectedCategory} ile ilgili.`;
        break; // İlk eşleşen anahtar kelimeyi al
      }
    }

    if (detectedCategory) {
      return {
        category: detectedCategory,
        confidence: 0.9, // Sabit yüksek güven, LLM simülasyonu için
        rationale: rationale.substring(0, 140), // 140 karakterle sınırlı
      };
    } else {
      return {
        category: "other",
        confidence: 0.5,
        rationale: "Belirlenen anahtar kelime bulunamadı.",
      };
    }
  }
} 