import type {
  AssessmentExplanation,
  AssessmentReport,
  AssessmentResult,
  ChartDataBundle,
  ErrorProfile,
  ProgressResult,
  SkillID,
  StudentID
} from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

/**
 * Tüm alt motorların çıktısını tek bir AssessmentReport'ta birleştirir.
 * Kendi başına hiçbir hesaplama yapmaz — yalnızca birleştirme sorumluluğu vardır.
 */
export class ReportingEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  assemble(params: {
    skillId: SkillID;
    studentId: StudentID;
    generatedAt: Date;
    latestResult: AssessmentResult;
    explanation: AssessmentExplanation;
    errorProfile: ErrorProfile;
    progress: ProgressResult;
    chartData: ChartDataBundle;
  }): AssessmentReport {
    return { ...params, configVersion: this.configProvider.config.version };
  }
}
