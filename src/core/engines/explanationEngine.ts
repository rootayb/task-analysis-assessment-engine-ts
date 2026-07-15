import {
  findStep,
  type AssessmentExplanation,
  type AssessmentResult,
  type ErrorProfile,
  type ProgressResult,
  type PromptProfile,
  type Reason,
  type Skill,
  type StepID
} from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

const MAX_ERROR_PRONE_STEPS_IN_EXPLANATION = 3;

/**
 * Her sonucun gerekçesini üretir. İlke: hiçbir AssessmentExplanation, en az bir
 * Reason içermeden üretilmez — sistem asla salt bir yüzde ile yetinmez.
 */
export class ExplanationEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  explain(params: {
    skill: Skill;
    result: AssessmentResult;
    promptProfile: PromptProfile;
    errorProfile: ErrorProfile;
    progress: ProgressResult;
  }): AssessmentExplanation {
    const { skill, result, promptProfile, errorProfile, progress } = params;
    const reasons: Reason[] = [];

    reasons.push({
      type: "independentStepCount",
      isPositive: true,
      value: result.independentSteps,
      message: `Bağımsız yapılan basamak sayısı: ${result.independentSteps}`
    });

    if (result.criticalEvaluation.hasCriticalFailure) {
      const names = result.criticalEvaluation.failedCriticalSteps
        .map((id) => findStep(skill, id)?.name ?? id)
        .join(", ");
      reasons.push({
        type: "criticalFailure",
        isPositive: false,
        message: `Kritik basamak başarısız: ${names} — beceri tam başarılı sayılamaz`
      });
    }

    const topErrorProneSteps = errorProfile.mostErrorProneSteps.slice(0, MAX_ERROR_PRONE_STEPS_IN_EXPLANATION);
    for (const entry of topErrorProneSteps) {
      const name = findStep(skill, entry.stepId)?.name ?? entry.stepId;
      reasons.push({
        type: "mostErrorProneStep",
        isPositive: false,
        relatedStepId: entry.stepId,
        value: entry.errorCount,
        message: `En fazla hata: ${name} (${entry.errorCount} kez)`
      });
    }

    if (promptProfile.totalPrompts > 0) {
      reasons.push({
        type: "promptDependency",
        isPositive: promptProfile.promptDependencyIndex < 2,
        value: promptProfile.promptDependencyIndex,
        message: `İpucu bağımlılık indeksi: ${promptProfile.promptDependencyIndex.toFixed(1)} (${promptProfile.totalPrompts} ipucu kullanıldı)`
      });
    }

    switch (progress.status) {
      case "İlerliyor":
        reasons.push({ type: "progressImproving", isPositive: true, message: "İlerleme hızı olumlu — beceri gelişiyor" });
        break;
      case "Durgunluk": {
        const thresholds = this.configProvider.config.progressThresholds;
        if (progress.consecutiveStagnantSessions >= thresholds.plateauSessionCount) {
          reasons.push({
            type: "progressPlateau",
            isPositive: false,
            value: progress.consecutiveStagnantSessions,
            message: `Son ${progress.consecutiveStagnantSessions} değerlendirmede ilerleme durdu — öğretim stratejisi gözden geçirilmeli`
          });
        }
        break;
      }
      case "Gerileme":
        reasons.push({
          type: "progressRegressing",
          isPositive: false,
          message: "Gerileme tespit edildi — son değerlendirmeler önceki seviyenin altında"
        });
        break;
      case "Yetersiz Veri":
        break;
    }

    if (result.completionRatio < 1) {
      reasons.push({
        type: "incompleteAssessment",
        isPositive: false,
        value: result.completionRatio,
        message: `Basamakların %${Math.round(result.completionRatio * 100)}'i değerlendirildi — bazı basamaklar gözlenmedi`
      });
    }

    const recommendedStepsToRetry: StepID[] = [];
    for (const stepId of result.criticalEvaluation.failedCriticalSteps) {
      if (!recommendedStepsToRetry.includes(stepId)) recommendedStepsToRetry.push(stepId);
    }
    for (const entry of topErrorProneSteps) {
      if (!recommendedStepsToRetry.includes(entry.stepId)) recommendedStepsToRetry.push(entry.stepId);
    }

    return {
      skillId: skill.id,
      successRate: result.successRate,
      overallSuccessLevel: result.overallSuccessLevel,
      reasons,
      mostErrorProneSteps: topErrorProneSteps,
      promptProfile,
      recommendedStepsToRetry
    };
  }
}
