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
  /**
   * Calculates the linear regression slope.
   * This is a simplified regression implementation (y = mx + b).
   * @param data The y-values of the points (category durations).
   * @returns The slope value (m).
   */
  private calculateLinearRegressionSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0; // Requires at least 2 points to calculate slope

    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_x2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // x as day number
      const y = data[i];

      sum_x += x;
      sum_y += y;
      sum_xy += x * y;
      sum_x2 += x * x;
    }

    const denominator = n * sum_x2 - sum_x * sum_x;
    if (denominator === 0) return 0; // Vertical line or all x values are the same

    const slope = (n * sum_xy - sum_x * sum_y) / denominator;
    return slope;
  }

  /**
   * Analyzes behavioral patterns and trends.
   * @param dailyTotals Daily category totals.
   * @param window Analysis window (number of days).
   * @returns Analysis results.
   */
  public analyzeBehavioralPatterns(dailyTotals: DailyCategoryTotals[], window: number): BehavioralAnalysisOutput {
    const relevantDailyTotals = dailyTotals.slice(-window); // Get the last 'window' days

    const trendingCategories: TrendingCategory[] = [];
    const allCategories = new Set<string>();

    relevantDailyTotals.forEach(day => {
      Object.keys(day.categories).forEach(cat => allCategories.add(cat));
    });

    for (const category of Array.from(allCategories)) {
      const categoryData = relevantDailyTotals.map(day => day.categories[category] || 0);
      if (categoryData.length < 2) continue; // Skip if not enough data

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

    // Sort by absolute slope and take the top 5
    trendingCategories.sort((a, b) => Math.abs(b.slope_per_day) - Math.abs(a.slope_per_day));
    const topTrendingCategories = trendingCategories.slice(0, 5);

    // Seasonality detection (Simplified/Placeholder for now. Autocorrelation would be more robust).
    // This can be expanded to a more complex algorithm later.
    const seasonality: SeasonalityPattern[] = [];
    // Example of a simple rule-based seasonality detection:
    // If activity consistently drops on weekends or specific days.
    const weekendDrop = this.detectWeekendDrop(relevantDailyTotals);
    if (weekendDrop) {
      seasonality.push({ period: "weekly", pattern: "Hafta sonları aktivite düşüşü gözlemlendi." });
    }

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
   * Detects a consistent drop in activity on weekends.
   * This is a simplified rule-based detection for seasonality.
   * @param dailyTotals Daily category totals.
   * @returns True if a weekend drop is detected, false otherwise.
   */
  private detectWeekendDrop(dailyTotals: DailyCategoryTotals[]): boolean {
    if (dailyTotals.length < 7) return false; // Need at least a week of data

    let weekdayTotals: number[] = [];
    let weekendTotals: number[] = [];

    for (let i = 0; i < dailyTotals.length; i++) {
      const day = new Date(dailyTotals[i].date);
      const totalActivity = Object.values(dailyTotals[i].categories).reduce((sum, val) => sum + val, 0);
      const dayOfWeek = day.getDay(); // 0 for Sunday, 6 for Saturday

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTotals.push(totalActivity);
      } else {
        weekdayTotals.push(totalActivity);
      }
    }

    if (weekdayTotals.length === 0 || weekendTotals.length === 0) return false;

    const avgWeekday = weekdayTotals.reduce((sum, val) => sum + val, 0) / weekdayTotals.length;
    const avgWeekend = weekendTotals.reduce((sum, val) => sum + val, 0) / weekendTotals.length;

    // Define a threshold for a significant drop (e.g., 30%)
    const dropThreshold = 0.30;

    return avgWeekend < avgWeekday * (1 - dropThreshold);
  }
} 