import type { ChartDataBundle, ChartDataPoint, ErrorProfile, ProgressResult, PromptProfile, Skill } from "../../domain/index.js";
import { findStep } from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

/**
 * Framework-bağımsız grafik veri noktaları üretir. Bu motor hiçbir zaman grafik çizmez —
 * yalnızca Chart.js/Recharts/D3'ün doğrudan tüketebileceği veri noktalarını hazırlar.
 */
export class ChartDataEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  progressLine(progress: ProgressResult): ChartDataPoint[] {
    return progress.points.map((point) => ({ label: dateFormatter.format(point.date), value: point.successRate }));
  }

  errorBar(errorProfile: ErrorProfile, skill: Skill): ChartDataPoint[] {
    return errorProfile.mostErrorProneSteps.map((entry) => ({
      label: findStep(skill, entry.stepId)?.name ?? entry.stepId,
      value: entry.errorCount
    }));
  }

  promptPie(promptProfile: PromptProfile): ChartDataPoint[] {
    const stateNames = new Map(this.configProvider.config.states.map((s) => [s.id, s.name]));
    return [...promptProfile.countsByType.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([state, count]) => ({ label: stateNames.get(state) ?? state, value: count }));
  }

  bundle(params: {
    progress: ProgressResult;
    errorProfile: ErrorProfile;
    promptProfile: PromptProfile;
    skill: Skill;
  }): ChartDataBundle {
    return {
      progressLine: this.progressLine(params.progress),
      errorBar: this.errorBar(params.errorProfile, params.skill),
      promptPie: this.promptPie(params.promptProfile)
    };
  }
}
