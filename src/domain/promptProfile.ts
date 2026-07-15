import type { AssessmentStateID } from "./ids.js";

export interface PromptProfile {
  readonly countsByType: ReadonlyMap<AssessmentStateID, number>;
  readonly totalPrompts: number;
  readonly mostFrequentPromptType?: AssessmentStateID;
  /** yüksek değer daha invaziv ipucu bağımlılığı demektir. */
  readonly promptDependencyIndex: number;
}
