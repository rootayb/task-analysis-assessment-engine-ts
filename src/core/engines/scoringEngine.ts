import { findObservation, findStep, type AssessmentSession, type Skill, type StepScore } from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

export interface ScoringCounters {
  readonly totalSteps: number;
  readonly evaluatedSteps: number;
  readonly independentSteps: number;
  readonly promptedSteps: number;
  readonly failedSteps: number;
  readonly exemptSteps: number;
  readonly notObservedSteps: number;
  readonly scorableSteps: number;
  readonly independenceRatio: number;
  readonly promptRatio: number;
  readonly completionRatio: number;
}

/**
 * Basamak durumlarını puana çevirir ve beceri bazlı sayaç/oranları hesaplar.
 * "Ratio" alanları 0-1 arası bir kesirdir; "Rate" (successRate) 0-100 arasıdır.
 */
export class ScoringEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  stepScores(skill: Skill, session: AssessmentSession): StepScore[] {
    const config = this.configProvider.config;

    return skill.steps.map((step): StepScore => {
      const observation = findObservation(session, step.id);
      if (!observation) {
        return { stepId: step.id, state: config.notObservedStateId, countsTowardAverage: false };
      }

      const stateDef = config.states.find((s) => s.id === observation.state);
      const rawScore = stateDef?.rawScore;
      const effectiveScore = rawScore !== undefined ? rawScore * (step.maxScore / 100) : undefined;

      return {
        stepId: step.id,
        state: observation.state,
        rawScore,
        effectiveScore,
        countsTowardAverage: rawScore !== undefined
      };
    });
  }

  counters(skill: Skill, stepScores: readonly StepScore[]): ScoringCounters {
    const config = this.configProvider.config;

    const totalSteps = skill.steps.length;
    const notObservedSteps = stepScores.filter((s) => s.state === config.notObservedStateId).length;
    const exemptSteps = stepScores.filter((s) => s.state === config.exemptStateId).length;
    const independentSteps = stepScores.filter((s) => s.state === config.independentStateId).length;
    const promptedSteps = stepScores.filter((s) => s.state in config.promptWeights).length;
    const failedSteps = stepScores.filter((s) => config.failureStates.includes(s.state)).length;
    const evaluatedSteps = totalSteps - notObservedSteps;
    const scorableSteps = evaluatedSteps - exemptSteps;

    return {
      totalSteps,
      evaluatedSteps,
      independentSteps,
      promptedSteps,
      failedSteps,
      exemptSteps,
      notObservedSteps,
      scorableSteps,
      independenceRatio: scorableSteps > 0 ? independentSteps / scorableSteps : 0,
      promptRatio: scorableSteps > 0 ? promptedSteps / scorableSteps : 0,
      completionRatio: totalSteps > 0 ? evaluatedSteps / totalSteps : 0
    };
  }

  /** successRate = (Σ effectiveScore / Σ maxScore, yalnızca sayılan basamaklar) × 100 */
  successRate(skill: Skill, stepScores: readonly StepScore[]): number {
    const countedScores = stepScores.filter((s) => s.countsTowardAverage);
    if (countedScores.length === 0) return 0;

    const totalEffective = countedScores.reduce((sum, s) => sum + (s.effectiveScore ?? 0), 0);
    const totalMaxScore = countedScores.reduce((sum, s) => sum + (findStep(skill, s.stepId)?.maxScore ?? 0), 0);

    if (totalMaxScore <= 0) return 0;
    return (totalEffective / totalMaxScore) * 100;
  }
}
