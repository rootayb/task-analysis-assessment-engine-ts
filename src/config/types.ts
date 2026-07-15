import type { AssessmentStateID } from "../domain/index.js";
import type { PerformanceLevel } from "../domain/index.js";

export interface AssessmentStateDefinition {
  readonly id: AssessmentStateID;
  readonly name: string;
  readonly order: number;
  /** undefined ise bu durum hesaba katılmaz (Gözlenmedi/Muaf gibi). */
  readonly rawScore?: number;
}

/** PerformanceLevel sınırları. [lower, upper) aralığı; en üst seviye [lower,100] dahil. */
export interface ThresholdConfig {
  readonly notStartedUpperBound: number;
  readonly veryLowUpperBound: number;
  readonly developingUpperBound: number;
  readonly goodUpperBound: number;
  readonly veryGoodUpperBound: number;
}

export interface ProgressThresholds {
  readonly improvingSlope: number;
  readonly plateauSlope: number;
  readonly plateauSessionCount: number;
}

/** Algoritmanın tüm ayarlanabilir parametrelerini bir arada tutan kök yapı. */
export interface AssessmentConfig {
  readonly version: string;
  readonly states: readonly AssessmentStateDefinition[];
  readonly failureStates: readonly AssessmentStateID[];
  readonly errorStates: readonly AssessmentStateID[];
  readonly promptWeights: Readonly<Record<string, number>>;
  readonly independentStateId: AssessmentStateID;
  readonly notObservedStateId: AssessmentStateID;
  readonly exemptStateId: AssessmentStateID;
  readonly thresholds: ThresholdConfig;
  readonly criticalFailureCapLevel: PerformanceLevel;
  readonly progressThresholds: ProgressThresholds;
  readonly errorAnalysisSessionWindow: number;
}
