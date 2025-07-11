import * as functions from 'firebase-functions';

interface ActivityEvent {
  app: string;
  title: string;
  url: string | null;
}

interface CommunityRule {
  pattern: string;
  category: string;
}

interface CommunityRuleMatchOutput {
  matched_rule: CommunityRule | null;
  category: string | null;
  source: string;
}

export class CommunityRulesService {
  // Geçici topluluk kuralları (gerçekte Firestore'dan çekilecek)
  private readonly MOCK_COMMUNITY_RULES: CommunityRule[] = [
    { pattern: "slack.exe", category: "communication" },
    { pattern: "meet.google.com", category: "communication" },
    { pattern: "*github.com*", category: "coding" },
    { pattern: "*stackoverflow.com*", category: "coding" },
    { pattern: "*figma.com*", category: "design" },
    { pattern: "*photoshop.exe", category: "design" },
    { pattern: "*reddit.com*", category: "social" },
    { pattern: "*facebook.com*", category: "social" },
    { pattern: "*steam.exe", category: "gaming" },
    { pattern: "*netflix.com*", category: "gaming" },
    { pattern: "*docs.google.com*", category: "productivity" },
    { pattern: "*notion.so*", category: "productivity" },
  ];

  /**
   * Glob desenini regex'e dönüştürür.
   * @param globPattern Dönüştürülecek glob deseni.
   * @returns Regex deseni.
   */
  private globToRegex(globPattern: string): RegExp {
    const escaped = globPattern.replace(/[.+^${}()|\[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`, 'i');
  }

  /**
   * Bir etkinliği topluluk kurallarına göre eşleştirir.
   * @param event Eşleştirilecek etkinlik.
   * @param communityRules Kullanılacak topluluk kuralları dizisi.
   * @returns Eşleşen kural ve kategori bilgisini içeren çıktı.
   */
  public matchCommunityRule(
    event: ActivityEvent,
    communityRules: CommunityRule[] = this.MOCK_COMMUNITY_RULES
  ): CommunityRuleMatchOutput {
    for (const rule of communityRules) {
      const regex = this.globToRegex(rule.pattern);
      
      // app eşleşmesi
      if (event.app && regex.test(event.app)) {
        return {
          matched_rule: rule,
          category: rule.category,
          source: "community",
        };
      }

      // title eşleşmesi
      if (event.title && regex.test(event.title)) {
        return {
          matched_rule: rule,
          category: rule.category,
          source: "community",
        };
      }

      // url eşleşmesi
      if (event.url && regex.test(event.url)) {
        return {
          matched_rule: rule,
          category: rule.category,
          source: "community",
        };
      }
    }

    return {
      matched_rule: null,
      category: null,
      source: "none",
    };
  }
} 