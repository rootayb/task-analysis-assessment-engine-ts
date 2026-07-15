import { findStep, minPerformanceLevel, type CriticalEvaluationResult, type PerformanceLevel, type Skill, type StepScore } from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

/**
 * Kritik basamak kuralını uygular: bir kritik basamak başarısızsa, beceri
 * sayısal olarak yüksek çıksa bile "tam başarılı" sayılamaz.
 */
export class CriticalStepEvaluator {
  constructor(private readonly configProvider: ConfigProviding) {}

  evaluate(skill: Skill, stepScores: readonly StepScore[]): CriticalEvaluationResult {
    const config = this.configProvider.config;

    const failedCriticalSteps = stepScores
      .filter((score) => {
        const step = findStep(skill, score.stepId);
        return step?.isCritical && config.failureStates.includes(score.state);
      })
      .map((s) => s.stepId);

    return { hasCriticalFailure: failedCriticalSteps.length > 0, failedCriticalSteps };
  }

  /** Ham successRate asla değiştirilmez — yalnızca yorumlanan seviye sınırlanır. */
  capLevel(level: PerformanceLevel, criticalEvaluation: CriticalEvaluationResult): PerformanceLevel {
    if (!criticalEvaluation.hasCriticalFailure) return level;
    return minPerformanceLevel(level, this.configProvider.config.criticalFailureCapLevel);
  }
}
