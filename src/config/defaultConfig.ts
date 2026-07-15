import { DefaultAssessmentStates } from "../domain/index.js";
import type { AssessmentConfig } from "./types.js";

/**
 * Kod içi varsayılan config. Bir kurum bu değerleri kendi JSON dosyasına kopyalayıp
 * `ConfigurationManager.fromJSON(...)` ile değiştirebilir — kod değişikliği gerekmez.
 */
export function defaultAssessmentConfig(): AssessmentConfig {
  return {
    version: "1.0.0",
    states: [
      { id: DefaultAssessmentStates.independent, name: "Bağımsız", order: 1, rawScore: 100 },
      { id: DefaultAssessmentStates.verbalPrompt, name: "Sözel İpucu", order: 2, rawScore: 80 },
      { id: DefaultAssessmentStates.gesturePrompt, name: "İşaret İpucu", order: 3, rawScore: 65 },
      { id: DefaultAssessmentStates.modeling, name: "Model Olma", order: 4, rawScore: 50 },
      { id: DefaultAssessmentStates.physicalPrompt, name: "Fiziksel Yardım", order: 5, rawScore: 30 },
      { id: DefaultAssessmentStates.fullPhysicalPrompt, name: "Tam Fiziksel Yardım", order: 6, rawScore: 10 },
      { id: DefaultAssessmentStates.failed, name: "Yapamadı", order: 7, rawScore: 0 },
      { id: DefaultAssessmentStates.notObserved, name: "Gözlenmedi", order: 8 },
      { id: DefaultAssessmentStates.exempt, name: "Muaf", order: 9 }
    ],
    failureStates: [DefaultAssessmentStates.failed],
    errorStates: [DefaultAssessmentStates.failed],
    promptWeights: {
      [DefaultAssessmentStates.verbalPrompt]: 1,
      [DefaultAssessmentStates.gesturePrompt]: 2,
      [DefaultAssessmentStates.modeling]: 3,
      [DefaultAssessmentStates.physicalPrompt]: 4,
      [DefaultAssessmentStates.fullPhysicalPrompt]: 5
    },
    independentStateId: DefaultAssessmentStates.independent,
    notObservedStateId: DefaultAssessmentStates.notObserved,
    exemptStateId: DefaultAssessmentStates.exempt,
    thresholds: {
      notStartedUpperBound: 20,
      veryLowUpperBound: 40,
      developingUpperBound: 60,
      goodUpperBound: 80,
      veryGoodUpperBound: 95
    },
    criticalFailureCapLevel: "Gelişiyor",
    progressThresholds: {
      improvingSlope: 0.5,
      plateauSlope: 0.5,
      plateauSessionCount: 3
    },
    errorAnalysisSessionWindow: 5
  };
}
