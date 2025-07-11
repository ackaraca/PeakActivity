import * as functions from 'firebase-functions';

interface ActivityEvent {
  app: string;
  title: string;
  url: string;
}

interface LabelResult {
  index: number;
  category: string;
  confidence: number;
}

interface AutoCategorizationOutput {
  labels: LabelResult[];
}

export class AutoCategorizationService {
  private readonly TAXONOMY = [
    'coding',
    'design',
    'research',
    'social',
    'gaming',
    'productivity',
    'communication',
  ];

  // Basitleştirilmiş anahtar kelime tabanlı kategorizasyon ve uygulama eşleştirmeleri
  private readonly KEYWORD_MAPPINGS: { [key: string]: string[] } = {
    'coding': ['code', 'github', 'stackoverflow', 'vscode', 'intellij', 'bug', 'develop'],
    'design': ['photoshop', 'figma', 'sketch', 'design', 'ui', 'ux', 'illustrator'],
    'research': ['wiki', 'scholar', 'research', 'article', 'paper', 'learn'],
    'social': ['facebook', 'twitter', 'linkedin', 'instagram', 'social', 'chat', 'meet'],
    'gaming': ['game', 'steam', 'epic', 'play', 'fortnite', 'lol'],
    'productivity': ['todo', 'task', 'notion', 'jira', 'asana', 'excel', 'docs'],
    'communication': ['email', 'outlook', 'gmail', 'slack', 'teams', 'zoom', 'call'],
  };

  private readonly APP_MAPPINGS: { [key: string]: string } = {
    'code.exe': 'coding',
    'photoshop.exe': 'design',
    'chrome.exe': 'research', // Varsayılan olarak araştırma, daha sonra title/url ile detaylandırılacak
    'discord.exe': 'social',
    'steam.exe': 'gaming',
    'outlook.exe': 'communication',
    'excel.exe': 'productivity',
  };

  /**
   * Otomatik kategorizasyon ve etiketleme işlemi.
   * @param events Kategorize edilecek etkinlikler dizisi.
   * @returns Etiketlenmiş etkinlikleri içeren bir çıktı nesnesi.
   */
  public categorizeEvents(events: ActivityEvent[]): AutoCategorizationOutput {
    const labels: LabelResult[] = [];

    events.forEach((event, index) => {
      const textToAnalyze = `${event.title.toLowerCase()} ${new URL(event.url).hostname.toLowerCase()}`;
      const appName = event.app.toLowerCase();

      let scores: { [category: string]: number } = {};
      this.TAXONOMY.forEach(category => (scores[category] = 0));

      // Anahtar kelime eşleştirme
      for (const category of this.TAXONOMY) {
        for (const keyword of this.KEYWORD_MAPPINGS[category] || []) {
          if (textToAnalyze.includes(keyword)) {
            scores[category] += 1;
          }
        }
      }

      // Uygulama eşleştirme ile puan artırma
      if (this.APP_MAPPINGS[appName]) {
        scores[this.APP_MAPPINGS[appName]] += 2; // Uygulama eşleşmeleri daha yüksek öncelikli
      }

      // Toplam puanı bul
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

      let assignedCategory = 'uncategorized';
      let confidence = 0;

      if (totalScore > 0) {
        // Softmax benzeri güven hesaplaması ve en yüksek kategoriyi seçme
        let maxScore = 0;
        for (const category of this.TAXONOMY) {
          if (scores[category] > maxScore) {
            maxScore = scores[category];
            assignedCategory = category;
          }
        }
        confidence = maxScore / totalScore; // Basit bir güven oranı
      }

      labels.push({
        index: index,
        category: assignedCategory,
        confidence: parseFloat(confidence.toFixed(2)),
      });
    });

    return { labels };
  }
} 