import type { AssessmentSession, Skill, StepID } from "../../domain/index.js";
import { findObservation } from "../../domain/index.js";
import type { ConfigProviding } from "../../config/index.js";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly relatedStepId?: StepID;
}

/**
 * Beceri tanımlarının ve oturum gözlemlerinin bütünlüğünü kontrol eder.
 * Sert reddetmek yerine (öğretmen girişini kaybetmemek için) çoğu durumu
 * uyarı (warning) olarak raporlar; yalnızca yapısal bozukluklar hata (error) sayılır.
 */
export class ValidationEngine {
  constructor(private readonly configProvider: ConfigProviding) {}

  validateSkill(skill: Skill): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (skill.steps.length === 0) {
      issues.push({ severity: "error", message: `${skill.name}: beceri hiç basamak içermiyor` });
      return issues;
    }

    const seenOrders = new Set<number>();
    for (const step of skill.steps) {
      if (seenOrders.has(step.order)) {
        issues.push({
          severity: "error",
          message: `Tekrarlanan sıra numarası: ${step.order} (${step.name})`,
          relatedStepId: step.id
        });
      }
      seenOrders.add(step.order);

      if (step.skillId !== skill.id) {
        issues.push({
          severity: "error",
          message: `${step.name} basamağının skillId'si ${skill.id} ile eşleşmiyor`,
          relatedStepId: step.id
        });
      }
    }

    return issues;
  }

  validateSession(session: AssessmentSession, skill: Skill): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const config = this.configProvider.config;

    for (const step of skill.steps.filter((s) => s.isRequired)) {
      const observation = findObservation(session, step.id);
      if (!observation) {
        issues.push({ severity: "warning", message: `${step.name}: zorunlu basamak için gözlem yok`, relatedStepId: step.id });
        continue;
      }

      const isPromptState = observation.state in config.promptWeights;
      if (
        !step.promptsAllowed &&
        observation.state !== config.independentStateId &&
        observation.state !== config.notObservedStateId &&
        observation.state !== config.exemptStateId &&
        isPromptState
      ) {
        issues.push({
          severity: "warning",
          message: `${step.name}: ipucuna izin verilmiyor ancak bir ipucu durumuyla işaretlenmiş`,
          relatedStepId: step.id
        });
      }
    }

    return issues;
  }
}
