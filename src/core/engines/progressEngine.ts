import type { ProgressPoint, ProgressResult, ProgressStatus } from "../../domain/index.js";
import type { ConfigProviding, ProgressThresholds } from "../../config/index.js";

const MS_PER_DAY = 86400000;

/**
 * Zaman içindeki değerlendirmelerden ilerleme hızını ve trendini çıkarır.
 * Düzensiz aralıklı değerlendirmelere karşı dayanıklı olması için `averageGrowth`
 * iki-nokta farkı yerine en küçük kareler (lineer regresyon) eğimi olarak hesaplanır.
 */
export class ProgressEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  analyze(points: readonly ProgressPoint[]): ProgressResult {
    const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
    const latest = sorted[sorted.length - 1];

    if (sorted.length < 2 || !latest) {
      return { points: sorted, status: "Yetersiz Veri", consecutiveStagnantSessions: 0 };
    }

    const thresholds = this.configProvider.config.progressThresholds;
    const weeklyGrowth = this.growth(sorted, latest, 7);
    const monthlyGrowth = this.growth(sorted, latest, 30);
    const averageGrowth = this.linearRegressionSlope(sorted);
    const status = this.classify(averageGrowth, thresholds);
    const consecutiveStagnantSessions = this.consecutiveStagnantCount(sorted, thresholds);

    return { points: sorted, weeklyGrowth, monthlyGrowth, averageGrowth, status, consecutiveStagnantSessions };
  }

  private growth(points: readonly ProgressPoint[], latest: ProgressPoint, daysBack: number): number | undefined {
    const targetTime = latest.date.getTime() - daysBack * MS_PER_DAY;
    const reference = [...points].reverse().find((p) => p.date.getTime() <= targetTime);
    if (!reference) return undefined;

    const daysDiff = (latest.date.getTime() - reference.date.getTime()) / MS_PER_DAY;
    if (daysDiff <= 0) return undefined;
    return (latest.successRate - reference.successRate) / daysDiff;
  }

  private linearRegressionSlope(points: readonly ProgressPoint[]): number | undefined {
    if (points.length < 2 || !points[0]) return undefined;

    const firstTime = points[0].date.getTime();
    const xs = points.map((p) => (p.date.getTime() - firstTime) / MS_PER_DAY);
    const ys = points.map((p) => p.successRate);
    const n = points.length;

    const sumX = xs.reduce((s, x) => s + x, 0);
    const sumY = ys.reduce((s, y) => s + y, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * (ys[i] ?? 0), 0);
    const sumXX = xs.reduce((s, x) => s + x * x, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return undefined;
    return (n * sumXY - sumX * sumY) / denominator;
  }

  private classify(slope: number | undefined, thresholds: ProgressThresholds): ProgressStatus {
    if (slope === undefined) return "Yetersiz Veri";
    if (slope > thresholds.improvingSlope) return "İlerliyor";
    if (slope < -thresholds.plateauSlope) return "Gerileme";
    return "Durgunluk";
  }

  /** Sondan başlayarak art arda kaç geçişin "durgunluk/gerileme" olduğunu sayar. */
  private consecutiveStagnantCount(points: readonly ProgressPoint[], thresholds: ProgressThresholds): number {
    if (points.length < 2) return 0;

    let count = 0;
    let index = points.length - 1;
    while (index > 0) {
      const current = points[index];
      const previous = points[index - 1];
      if (!current || !previous) break;

      const daysDiff = (current.date.getTime() - previous.date.getTime()) / MS_PER_DAY;
      if (daysDiff <= 0) {
        index -= 1;
        continue;
      }
      const slope = (current.successRate - previous.successRate) / daysDiff;
      if (slope > thresholds.improvingSlope) break;
      count += 1;
      index -= 1;
    }
    return count;
  }
}
