import { db } from "../firebaseAdmin";

interface DailyTotal {
  date: string;
  total_seconds: number;
}

interface AnomalyResult {
  date: string;
  z_score: number;
  deviation_percent: number;
}

interface AnomalyOutput {
  anomalies: AnomalyResult[];
  baseline_mean: number;
  baseline_stddev: number;
  explanation: string;
}

export class AnomalyDetectionService {
  /**
   * Calculates the mean of an array of numbers.
   * @param data The array of numbers.
   * @returns The mean.
   */
  private calculateMean(data: number[]): number {
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }

  /**
   * Calculates the standard deviation of an array of numbers.
   * @param data The array of numbers.
   * @param mean The pre-calculated mean of the data.
   * @returns The standard deviation.
   */
  private calculateStandardDeviation(data: number[], mean: number): number {
    const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
    const sumOfSquaredDifferences = squaredDifferences.reduce((acc, val) => acc + val, 0);
    return Math.sqrt(sumOfSquaredDifferences / data.length);
  }

  /**
   * Detects anomalies in daily activity totals based on z-score.
   * @param dailyTotals An array of daily activity totals.
   * @returns An AnomalyOutput object containing detected anomalies and baseline statistics.
   */
  public detectAnomalies(dailyTotals: DailyTotal[]): AnomalyOutput {
    const totalSecondsValues = dailyTotals.map(d => d.total_seconds);

    if (totalSecondsValues.length < 2) {
      return {
        anomalies: [],
        baseline_mean: 0,
        baseline_stddev: 0,
        explanation: "Anomali tespiti için yeterli veri yok. En az 2 günlük veri gereklidir."
      };
    }

    const mean = this.calculateMean(totalSecondsValues);
    const stdDev = this.calculateStandardDeviation(totalSecondsValues, mean);

    const anomalies: AnomalyResult[] = [];

    for (const dailyTotal of dailyTotals) {
      if (stdDev === 0) {
        // Handle case where standard deviation is zero (all values are the same)
        if (dailyTotal.total_seconds !== mean) {
          // If a value is different from the mean, it's an anomaly
          anomalies.push({
            date: dailyTotal.date,
            z_score: dailyTotal.total_seconds > mean ? Infinity : -Infinity,
            deviation_percent: ((dailyTotal.total_seconds - mean) / mean) * 100
          });
        }
        continue;
      }

      const zScore = (dailyTotal.total_seconds - mean) / stdDev;
      if (Math.abs(zScore) >= 2) {
        anomalies.push({
          date: dailyTotal.date,
          z_score: parseFloat(zScore.toFixed(2)),
          deviation_percent: parseFloat(((dailyTotal.total_seconds - mean) / mean * 100).toFixed(2))
        });
      }
    }

    anomalies.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));

    return {
      anomalies: anomalies.slice(0, 10),
      baseline_mean: parseFloat(mean.toFixed(2)),
      baseline_stddev: parseFloat(stdDev.toFixed(2)),
      explanation: anomalies.length > 0 ? "Belirlenen aktivite verilerinde anormal günler tespit edildi." : "Anormal aktivite verisi tespit edilmedi."
    };
  }
} 