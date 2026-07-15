import type { AssessmentStateID, SessionID, SkillID, StepID } from "./ids.js";
import type { PerformanceLevel } from "./performanceLevel.js";

export interface StepScore {
  readonly stepId: StepID;
  readonly state: AssessmentStateID;
  /** Config'teki ham puan (0-100). undefined ise bu durum hesaba katılmaz. */
  readonly rawScore?: number;
  readonly effectiveScore?: number;
  readonly countsTowardAverage: boolean;
}

export interface CriticalEvaluationResult {
  readonly hasCriticalFailure: boolean;
  readonly failedCriticalSteps: readonly StepID[];
}

export interface AssessmentResult {
  readonly skillId: SkillID;
  readonly sessionId: SessionID;
  readonly stepScores: readonly StepScore[];

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
  readonly successRate: number;
  readonly completionRatio: number;

  readonly criticalEvaluation: CriticalEvaluationResult;
  readonly overallSuccessLevel: PerformanceLevel;
}
