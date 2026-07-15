import type { AssessmentSession, ErrorProfile, Skill, StepErrorEntry, StepID } from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";
import type { ScoringEngine } from "./scoringEngine.js";

/**
 * Birden fazla oturum üzerinden en çok hata yapılan basamakları bulur.
 * Tek bir oturumdan ziyade `config.errorAnalysisSessionWindow` kadar son oturumu
 * kullanmak, tek seferlik bir kötü günle kalıcı bir zorluğu birbirinden ayırt eder.
 */
export class ErrorAnalysisEngine {
  constructor(private readonly configProvider: ConfigProviding, private readonly scoringEngine: ScoringEngine) {}

  analyze(skill: Skill, sessions: readonly AssessmentSession[]): ErrorProfile {
    const config = this.configProvider.config;
    const recentSessions = [...sessions]
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
      .slice(0, config.errorAnalysisSessionWindow);

    const errorCounts = new Map<StepID, number>();
    const evaluatedCounts = new Map<StepID, number>();

    for (const session of recentSessions) {
      const stepScores = this.scoringEngine.stepScores(skill, session);
      for (const score of stepScores) {
        if (score.state === config.notObservedStateId) continue;
        evaluatedCounts.set(score.stepId, (evaluatedCounts.get(score.stepId) ?? 0) + 1);
        if (config.errorStates.includes(score.state)) {
          errorCounts.set(score.stepId, (errorCounts.get(score.stepId) ?? 0) + 1);
        }
      }
    }

    const errorRateByStep = new Map<StepID, number>();
    for (const [stepId, evaluatedCount] of evaluatedCounts) {
      if (evaluatedCount > 0) {
        errorRateByStep.set(stepId, (errorCounts.get(stepId) ?? 0) / evaluatedCount);
      }
    }

    const mostErrorProneSteps: StepErrorEntry[] = [...errorCounts.entries()]
      .map(([stepId, errorCount]) => ({ stepId, errorCount, errorRate: errorRateByStep.get(stepId) ?? 0 }))
      .sort((a, b) => (a.errorCount === b.errorCount ? a.stepId.localeCompare(b.stepId) : b.errorCount - a.errorCount));

    return { errorCountsByStep: errorCounts, mostErrorProneSteps, errorRateByStep };
  }
}
