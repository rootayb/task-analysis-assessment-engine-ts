import type { AssessmentStateID, PromptProfile, StepScore } from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

/** Bir oturumdaki ipucu (prompt) kullanım dağılımını ve invaziflik bağımlılığını hesaplar. */
export class PromptAnalysisEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  analyze(stepScores: readonly StepScore[]): PromptProfile {
    const config = this.configProvider.config;
    const promptScores = stepScores.filter((s) => s.state in config.promptWeights);

    const countsByType = new Map<AssessmentStateID, number>();
    for (const score of promptScores) {
      countsByType.set(score.state, (countsByType.get(score.state) ?? 0) + 1);
    }

    const totalPrompts = promptScores.length;

    let mostFrequentPromptType: AssessmentStateID | undefined;
    let maxCount = -1;
    for (const [state, count] of [...countsByType.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentPromptType = state;
      }
    }

    let weightedSum = 0;
    for (const [state, count] of countsByType) {
      weightedSum += (config.promptWeights[state] ?? 0) * count;
    }
    const promptDependencyIndex = totalPrompts > 0 ? weightedSum / totalPrompts : 0;

    return {
      countsByType,
      totalPrompts,
      mostFrequentPromptType,
      promptDependencyIndex
    };
  }
}
