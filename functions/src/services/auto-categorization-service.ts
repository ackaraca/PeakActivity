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
    'coding': ['code', 'github', 'stackoverflow', 'vscode', 'intellij', 'bug', 'develop', 'programming'],
    'design': ['photoshop', 'figma', 'sketch', 'design', 'ui', 'ux', 'illustrator', 'blender'],
    'research': ['wiki', 'scholar', 'research', 'article', 'paper', 'learn', 'study', 'analyze'],
    'social': ['facebook', 'twitter', 'linkedin', 'instagram', 'social', 'chat', 'meet', 'discord'],
    'gaming': ['game', 'steam', 'epic', 'play', 'fortnite', 'lol'],
    'productivity': ['todo', 'task', 'notion', 'jira', 'asana', 'excel', 'docs', 'word', 'powerpoint'],
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
    'slack.exe': 'communication',
    'msedge.exe': 'research', // Edge de varsayılan olarak araştırma
    'firefox.exe': 'research', // Firefox da varsayılan olarak araştırma
    'teams.exe': 'communication',
  };

  private keywordRegexes: Map<string, RegExp[]> = new Map();

  constructor() {
    for (const category in this.KEYWORD_MAPPINGS) {
      const regexes: RegExp[] = [];
      for (const keyword of this.KEYWORD_MAPPINGS[category]) {
        regexes.push(new RegExp(`\\b${keyword}\\b`, 'gi'));
      }
      this.keywordRegexes.set(category, regexes);
    }
  }

  /**
   * Otomatik kategorizasyon ve etiketleme işlemi.
   * @param events Kategorize edilecek etkinlikler dizisi.
   * @returns Etiketlenmiş etkinlikleri içeren bir çıktı nesnesi.
   */
  public categorizeEvents(events: ActivityEvent[]): AutoCategorizationOutput {
    const labels: LabelResult[] = [];

    events.forEach((event, index) => {
      const titleDomain = `${event.title.toLowerCase()} ${new URL(event.url).hostname.toLowerCase()}`;
      const appName = event.app.toLowerCase();

      let scores: { [category: string]: number } = {};
      this.TAXONOMY.forEach(category => (scores[category] = 0));

      // 1. Tokenize title + domain of url. (Yapıldı)

      // 2. Use TF-IDF against curated corpus to get top 3 candidate categories. (Basitleştirilmiş anahtar kelime puanlaması)
      for (const category of this.TAXONOMY) {
        const regexes = this.keywordRegexes.get(category);
        if (regexes) {
          for (const regex of regexes) {
            const matches = titleDomain.match(regex);
            if (matches) {
              scores[category] += matches.length; // Kelime frekansını puan olarak ekle
            }
          }
        }
      }

      // 3. Boost score if app/process matches known mapping list.
      if (this.APP_MAPPINGS[appName]) {
        scores[this.APP_MAPPINGS[appName]] += 3; // Uygulama eşleşmeleri daha yüksek öncelikli
      }

      // 4. Normalize scores; choose highest as label. Confidence = softmax probability.
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

      let assignedCategory: string | null = null;
      let confidence = 0;

      if (totalScore > 0) {
        // Softmax benzeri güven hesaplaması
        const expScores: { [category: string]: number } = {};
        this.TAXONOMY.forEach(category => {
          expScores[category] = Math.exp(scores[category]);
        });

        const sumExpScores = Object.values(expScores).reduce((sum, val) => sum + val, 0);

        let maxProb = 0;
        for (const category of this.TAXONOMY) {
          const prob = expScores[category] / sumExpScores;
          if (prob > maxProb) {
            maxProb = prob;
            assignedCategory = category;
          }
        }
        confidence = maxProb;
      } else {
        // Eğer hiçbir kategoriye puan atanmamışsa, varsayılan olarak "uncategorized"
        assignedCategory = 'uncategorized';
        confidence = 0;
      }
      
      labels.push({
        index: index,
        category: assignedCategory as string,
        confidence: parseFloat(confidence.toFixed(2)),
      });
    });

    return { labels };
  }
} 