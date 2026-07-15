import type { AssessmentReport, AssessmentResult, AssessmentSession, ProgressPoint, Skill, StudentID } from "../domain/index.js";
import type { ConfigProviding } from "../config/index.js";
import {
  ChartDataEngine,
  CriticalStepEvaluator,
  ErrorAnalysisEngine,
  ExplanationEngine,
  PromptAnalysisEngine,
  ProgressEngine,
  ReportingEngine,
  ScoringEngine,
  ValidationEngine,
  classifyPerformanceLevel,
  type ValidationIssue
} from "./engines/index.js";

export interface AssessmentEngineOptions {
  readonly now?: () => Date;
}

/**
 * Tüm alt motorları orkestre eden ana bileşen. Saf fonksiyoneldir:
 * aynı (Skill, AssessmentSession[]) girdisi her zaman aynı AssessmentReport'u üretir.
 */
export class AssessmentEngine {
  private readonly validationEngine: ValidationEngine;
  private readonly scoringEngine: ScoringEngine;
  private readonly criticalStepEvaluator: CriticalStepEvaluator;
  private readonly promptAnalysisEngine: PromptAnalysisEngine;
  private readonly errorAnalysisEngine: ErrorAnalysisEngine;
  private readonly progressEngine: ProgressEngine;
  private readonly chartDataEngine: ChartDataEngine;
  private readonly explanationEngine: ExplanationEngine;
  private readonly reportingEngine: ReportingEngine;
  private readonly now: () => Date;

  constructor(private readonly configProvider: ConfigProviding, options: AssessmentEngineOptions = {}) {
    this.validationEngine = new ValidationEngine(configProvider);
    this.scoringEngine = new ScoringEngine(configProvider);
    this.criticalStepEvaluator = new CriticalStepEvaluator(configProvider);
    this.promptAnalysisEngine = new PromptAnalysisEngine(configProvider);
    this.errorAnalysisEngine = new ErrorAnalysisEngine(configProvider, this.scoringEngine);
    this.progressEngine = new ProgressEngine(configProvider);
    this.chartDataEngine = new ChartDataEngine(configProvider);
    this.explanationEngine = new ExplanationEngine(configProvider);
    this.reportingEngine = new ReportingEngine(configProvider);
    this.now = options.now ?? (() => new Date());
  }

  /** Tek bir oturum için ham puanlama sonucu (ScoringEngine + CriticalStepEvaluator birleşimi). */
  result(session: AssessmentSession, skill: Skill): AssessmentResult {
    const stepScores = this.scoringEngine.stepScores(skill, session);
    const counters = this.scoringEngine.counters(skill, stepScores);
    const successRate = this.scoringEngine.successRate(skill, stepScores);
    const criticalEvaluation = this.criticalStepEvaluator.evaluate(skill, stepScores);
    const rawLevel = classifyPerformanceLevel(successRate, this.configProvider.config.thresholds);
    const overallSuccessLevel = this.criticalStepEvaluator.capLevel(rawLevel, criticalEvaluation);

    return {
      skillId: skill.id,
      sessionId: session.id,
      stepScores,
      ...counters,
      successRate,
      criticalEvaluation,
      overallSuccessLevel
    };
  }

  /** Basamak/oturum doğrulama uyarılarını döner (bloklamaz, yalnızca raporlar). */
  validate(skill: Skill, session: AssessmentSession): ValidationIssue[] {
    return [...this.validationEngine.validateSkill(skill), ...this.validationEngine.validateSession(session, skill)];
  }

  /**
   * Bir öğrencinin bir beceri üzerindeki tüm geçmişinden nihai, açıklanabilir raporu üretir.
   * `sessions` boş olamaz; en güncel oturum `latestResult` olarak kullanılır, tüm geçmiş
   * ilerleme/hata analizine girdi olur.
   */
  generateReport(skill: Skill, studentId: StudentID, sessions: readonly AssessmentSession[]): AssessmentReport | undefined {
    const latestSession = [...sessions].sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())[0];
    if (!latestSession) return undefined;

    const latestResult = this.result(latestSession, skill);
    const promptProfile = this.promptAnalysisEngine.analyze(latestResult.stepScores);
    const errorProfile = this.errorAnalysisEngine.analyze(skill, sessions);

    const progressPoints: ProgressPoint[] = sessions.map((session) => ({
      date: session.observedAt,
      successRate: this.result(session, skill).successRate
    }));
    const progress = this.progressEngine.analyze(progressPoints);

    const chartData = this.chartDataEngine.bundle({ progress, errorProfile, promptProfile, skill });
    const explanation = this.explanationEngine.explain({ skill, result: latestResult, promptProfile, errorProfile, progress });

    return this.reportingEngine.assemble({
      skillId: skill.id,
      studentId,
      generatedAt: this.now(),
      latestResult,
      explanation,
      errorProfile,
      progress,
      chartData
    });
  }
}
