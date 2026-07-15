import type { PerformanceLevel } from "../../domain/index.js";
import type { ThresholdConfig } from "../../config/index.js";

export function classifyPerformanceLevel(successRate: number, thresholds: ThresholdConfig): PerformanceLevel {
  if (successRate < thresholds.notStartedUpperBound) return "Başlanmadı";
  if (successRate < thresholds.veryLowUpperBound) return "Çok Düşük";
  if (successRate < thresholds.developingUpperBound) return "Gelişiyor";
  if (successRate < thresholds.goodUpperBound) return "İyi";
  if (successRate < thresholds.veryGoodUpperBound) return "Çok İyi";
  return "Bağımsız";
}
