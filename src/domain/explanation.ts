import type { StepID, SkillID, StudentID } from "./ids.js";
import type { ErrorProfile, StepErrorEntry } from "./errorProfile.js";
import type { PromptProfile } from "./promptProfile.js";
import type { PerformanceLevel } from "./performanceLevel.js";
import type { ProgressResult } from "./progress.js";
import type { ChartDataBundle } from "./chartData.js";
import type { AssessmentResult } from "./scoring.js";

export type ReasonType =
  | "independentStepCount"
  | "criticalFailure"
  | "highSuccessRate"
  | "lowSuccessRate"
  | "mostErrorProneStep"
  | "promptDependency"
  | "progressImproving"
  | "progressPlateau"
  | "progressRegressing"
  | "incompleteAssessment";

export interface Reason {
  readonly type: ReasonType;
  readonly isPositive: boolean;
  readonly relatedStepId?: StepID;
  readonly value?: number;
  readonly message: string;
}

/** Hiçbir AssessmentExplanation, en az bir Reason içermeden üretilmez. */
export interface AssessmentExplanation {
  readonly skillId: SkillID;
  readonly successRate: number;
  readonly overallSuccessLevel: PerformanceLevel;
  readonly reasons: readonly Reason[];
  readonly mostErrorProneSteps: readonly StepErrorEntry[];
  readonly promptProfile: PromptProfile;
  readonly recommendedStepsToRetry: readonly StepID[];
}

/** ReportingEngine'in ürettiği, bir beceri için nihai birleşik rapor. */
export interface AssessmentReport {
  readonly skillId: SkillID;
  readonly studentId: StudentID;
  readonly generatedAt: Date;
  readonly latestResult: AssessmentResult;
  readonly explanation: AssessmentExplanation;
  readonly errorProfile: ErrorProfile;
  readonly progress: ProgressResult;
  readonly chartData: ChartDataBundle;
  readonly configVersion: string;
}
