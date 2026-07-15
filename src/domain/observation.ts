import type { AssessmentStateID, ObservationID, SessionID, SkillID, StepID, StudentID } from "./ids.js";
import type { Environment } from "./domain.js";

/** Tek bir basamağın tek bir oturumdaki gözlemi. */
export interface StepObservation {
  readonly id: ObservationID;
  readonly stepId: StepID;
  readonly state: AssessmentStateID;
  readonly notes?: string;
  /** Bu basamakta kaç kez ipucu verildiği. */
  readonly promptCount?: number;
}

/** Bir öğrencinin bir beceri üzerindeki tek bir değerlendirme oturumu. */
export interface AssessmentSession {
  readonly id: SessionID;
  readonly skillId: SkillID;
  readonly studentId: StudentID;
  readonly environment: Environment;
  readonly assessorId?: string;
  readonly observations: readonly StepObservation[];
  readonly observedAt: Date;
  readonly generalNotes?: string;
}

export function findObservation(session: AssessmentSession, stepId: StepID): StepObservation | undefined {
  return session.observations.find((o) => o.stepId === stepId);
}
