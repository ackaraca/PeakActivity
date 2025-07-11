import * as functions from 'firebase-functions';

interface DailyCategoryTotals {
  date: string;
  categories: { [category: string]: number };
}

interface TrendingCategory {
  category: string;
  trend: 'rising' | 'falling' | 'stable';
  slope_per_day: number;
}

interface SeasonalityPattern {
  period: string;
  pattern: string;
}

interface BehavioralAnalysisOutput {
  trending_categories: TrendingCategory[];
  seasonality: SeasonalityPattern[];
  summary: string;
}

export class BehavioralAnalysisService {

  // Geçici veri: Gerçek uygulamada Firestore'dan veya başka bir kaynaktan alınacak
  private readonly MOCK_DAILY_TOTALS: DailyCategoryTotals[] = [
    { date: "2023-01-01", categories: { "coding": 15000, "browsing": 8000, "social": 1000, "gaming": 500 } },
    { date: "2023-01-02", categories: { "coding": 15500, "browsing": 7800, "social": 1100, "gaming": 600 } },
    { date: "2023-01-03", categories: { "coding": 16000, "browsing": 7500, "social": 1200, "gaming": 550 } },
    { date: "2023-01-04", categories: { "coding": 16200, "browsing": 7000, "social": 1300, "gaming": 700 } },
    { date: "2023-01-05", categories: { "coding": 16500, "browsing": 6800, "social": 1400, "gaming": 650 } },
    { date: "2023-01-06", categories: { "coding": 17000, "browsing": 6500, "social": 1500, "gaming": 800 } },
    { date: "2023-01-07", categories: { "coding": 17200, "browsing": 6300, "social": 1600, "gaming": 750 } },
    { date: "2023-01-08", categories: { "coding": 17500, "browsing": 6000, "social": 1700, "gaming": 900 } },
    { date: "2023-01-09", categories: { "coding": 17800, "browsing": 5800, "social": 1800, "gaming": 850 } },
    { date: "2023-01-10", categories: { "coding": 18000, "browsing": 5500, "social": 1900, "gaming": 1000 } },
    { date: "2023-01-11", categories: { "coding": 18200, "browsing": 5300, "social": 2000, "gaming": 950 } },
    { date: "2023-01-12", categories: { "coding": 18500, "browsing": 5000, "social": 2100, "gaming": 1100 } },
    { date: "2023-01-13", categories: { "coding": 18800, "browsing": 4800, "social": 2200, "gaming": 1050 } },
    { date: "2023-01-14", categories: { "coding": 19000, "browsing": 4500, "social": 2300, "gaming": 1200 } },
    { date: "2023-01-15", categories: { "coding": 19200, "browsing": 4300, "social": 2400, "gaming": 1150 } },
    { date: "2023-01-16", categories: { "coding": 19500, "browsing": 4000, "social": 2500, "gaming": 1300 } },
    { date: "2023-01-17", categories: { "coding": 19800, "browsing": 3800, "social": 2600, "gaming": 1250 } },
    { date: "2023-01-18", categories: { "coding": 20000, "browsing": 3500, "social": 2700, "gaming": 1400 } },
    { date: "2023-01-19", categories: { "coding": 20200, "browsing": 3300, "social": 2800, "gaming": 1350 } },
    { date: "2023-01-20", categories: { "coding": 20500, "browsing": 3000, "social": 2900, "gaming": 1500 } },
    { date: "2023-01-21", categories: { "coding": 20800, "browsing": 2800, "social": 3000, "gaming": 1450 } },
    { date: "2023-01-22", categories: { "coding": 21000, "browsing": 2500, "social": 3100, "gaming": 1600 } },
    { date: "2023-01-23", categories: { "coding": 21200, "browsing": 2300, "social": 3200, "gaming": 1550 } },
    { date: "2023-01-24", categories: { "coding": 21500, "browsing": 2000, "social": 3300, "gaming": 1700 } },
    { date: "2023-01-25", categories: { "coding": 21800, "browsing": 1800, "social": 3400, "gaming": 1650 } },
    { date: "2023-01-26", categories: { "coding": 22000, "browsing": 1500, "social": 3500, "gaming": 1800 } },
    { date: "2023-01-27", categories: { "coding": 22200, "browsing": 1300, "social": 3600, "gaming": 1750 } },
    { date: "2023-01-28", categories: { "coding": 22500, "browsing": 1000, "social": 3700, "gaming": 1900 } },
    { date: "2023-01-29", categories: { "coding": 22800, "browsing": 800, "social": 3800, "gaming": 1850 } },
    { date: "2023-01-30", categories: { "coding": 23000, "browsing": 500, "social": 3900, "gaming": 2000 } }
];

  /**
   * Doğrusal regresyon eğimini hesaplar.
   * Basit bir regresyon uygulamasıdır (y = mx + b).
   * @param data Noktaların y-değerleri (kategori süreleri).
   * @returns Eğimin değeri (m).
   */
  private calculateLinearRegressionSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0; // Eğim hesaplamak için en az 2 nokta gerekir

    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_x2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // Gün sayısı olarak x
      const y = data[i];

      sum_x += x;
      sum_y += y;
      sum_xy += x * y;
      sum_x2 += x * x;
    }

    const denominator = n * sum_x2 - sum_x * sum_x;
    if (denominator === 0) return 0; // Dikey çizgi veya tüm x değerleri aynı

    const slope = (n * sum_xy - sum_x * sum_y) / denominator;
    return slope;
  }

  /**
   * Davranışsal desenleri ve trendleri analiz eder.
   * @param dailyTotals Günlük kategori toplamları.
   * @param window Analiz penceresi (gün sayısı).
   * @returns Analiz sonuçları.
   */
  public analyzeBehavioralPatterns(dailyTotals: DailyCategoryTotals[], window: number): BehavioralAnalysisOutput {
    const relevantDailyTotals = dailyTotals.slice(-window); // Son 'window' gününü al

    const trendingCategories: TrendingCategory[] = [];
    const allCategories = new Set<string>();

    relevantDailyTotals.forEach(day => {
      Object.keys(day.categories).forEach(cat => allCategories.add(cat));
    });

    for (const category of Array.from(allCategories)) {
      const categoryData = relevantDailyTotals.map(day => day.categories[category] || 0);
      if (categoryData.length < 2) continue; // Yeterli veri yoksa atla

      const slope = this.calculateLinearRegressionSlope(categoryData);
      let trend: 'rising' | 'falling' | 'stable' = 'stable';

      if (slope > 100) {
        trend = 'rising';
      } else if (slope < -100) {
        trend = 'falling';
      }

      trendingCategories.push({
        category: category,
        trend: trend,
        slope_per_day: parseFloat(slope.toFixed(2)),
      });
    }

    // Mutlak eğime göre sırala ve ilk 5'i al
    trendingCategories.sort((a, b) => Math.abs(b.slope_per_day) - Math.abs(a.slope_per_day));
    const topTrendingCategories = trendingCategories.slice(0, 5);

    // Mevsimsellik tespiti (Şimdilik yer tutucu, daha karmaşık bir algoritma gerektirir)
    const seasonality: SeasonalityPattern[] = [
      { period: "weekly", pattern: "Hafta sonları aktivite düşüşü gözlemlendi." },
      { period: "monthly", pattern: "Ay sonlarına doğru yoğunlaşma." } // Örnek
    ];

    // Özet metni oluştur
    let summary = "Genel aktivite desenleri analiz edildi.";
    if (topTrendingCategories.length > 0) {
      summary = "Belirli kategorilerde artan veya azalan trendler tespit edildi: ";
      summary += topTrendingCategories.map(t => `${t.category} (${t.trend})`).join(", ") + ".";
    }

    return {
      trending_categories: topTrendingCategories,
      seasonality: seasonality,
      summary: summary,
    };
  }

  /**
   * Davranışsal analiz için geçici günlük kategori toplamlarını döndürür.
   * Gerçek uygulamada, bu Firestore'dan verileri çekecektir.
   * @returns DailyCategoryTotals nesnelerinin bir dizisine çözümleyen bir Promise.
   */
  public async getDailyCategoryTotals(window: number = 30): Promise<DailyCategoryTotals[]> {
    // Veritabanından veri çekmeyi simüle et
    return new Promise(resolve => {
      setTimeout(() => {
        // Son 'window' gün kadar mock veri döndür
        resolve(this.MOCK_DAILY_TOTALS.slice(-window));
      }, 500); // Ağ gecikmesini simüle et
    });
  }
} 