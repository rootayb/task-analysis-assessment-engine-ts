import type { StepID } from "./ids.js";

export interface StepErrorEntry {
  readonly stepId: StepID;
  readonly errorCount: number;
  readonly errorRate: number;
}

export interface ErrorProfile {
  readonly errorCountsByStep: ReadonlyMap<StepID, number>;
  /** errorCountsByStep'ten azalan sırada. */
  readonly mostErrorProneSteps: readonly StepErrorEntry[];
  readonly errorRateByStep: ReadonlyMap<StepID, number>;
}
