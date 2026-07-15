declare const skillIdBrand: unique symbol;
export type SkillID = string & { readonly [skillIdBrand]: true };

declare const stepIdBrand: unique symbol;
export type StepID = string & { readonly [stepIdBrand]: true };

declare const studentIdBrand: unique symbol;
export type StudentID = string & { readonly [studentIdBrand]: true };

declare const observationIdBrand: unique symbol;
export type ObservationID = string & { readonly [observationIdBrand]: true };

declare const sessionIdBrand: unique symbol;
export type SessionID = string & { readonly [sessionIdBrand]: true };

/**
 * Değerlendirme durumu kimliği. Kapalı bir union DEĞİLDİR — hangi durumların var olduğu,
 * puanları ve sırası tamamen config'ten (AssessmentConfig.states) gelir.
 */
declare const assessmentStateIdBrand: unique symbol;
export type AssessmentStateID = string & { readonly [assessmentStateIdBrand]: true };

export function skillId(value: string): SkillID {
  return value as SkillID;
}
export function stepId(value: string): StepID {
  return value as StepID;
}
export function studentId(value: string): StudentID {
  return value as StudentID;
}
export function observationId(value: string): ObservationID {
  return value as ObservationID;
}
export function sessionId(value: string): SessionID {
  return value as SessionID;
}
export function assessmentStateId(value: string): AssessmentStateID {
  return value as AssessmentStateID;
}

/** Varsayılan config ile birlikte gelen durum kimlikleri — kolaylık sabitleri. */
export const DefaultAssessmentStates = {
  independent: assessmentStateId("independent"),
  verbalPrompt: assessmentStateId("verbalPrompt"),
  gesturePrompt: assessmentStateId("gesturePrompt"),
  modeling: assessmentStateId("modeling"),
  physicalPrompt: assessmentStateId("physicalPrompt"),
  fullPhysicalPrompt: assessmentStateId("fullPhysicalPrompt"),
  failed: assessmentStateId("failed"),
  notObserved: assessmentStateId("notObserved"),
  exempt: assessmentStateId("exempt")
} as const;
