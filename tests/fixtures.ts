import { createSkill, createStep, observationId, sessionId, skillId, stepId, type AssessmentSession, type AssessmentStateID, type Environment, type Skill, type StepID, type StudentID } from "../src/domain/index.js";

/** El Yıkama — 8 basamak, kritik basamak yok. */
export function handWashingSkill(): Skill {
  const skill = skillId("hand-washing");
  const names = ["Musluğu aç", "Ellerini ıslat", "Sabun al", "Sabunu sür", "Ovala", "Durula", "Musluğu kapat", "Kurula"];
  const steps = names.map((name, i) =>
    createStep({
      id: stepId(`hw-${i + 1}`),
      skillId: skill,
      order: i + 1,
      name,
      description: name,
      isCritical: false,
      maxScore: 100
    })
  );
  return createSkill({ id: skill, name: "El Yıkama", domain: "Özbakım", steps });
}

/** Çay Hazırlama — "Ocağı Aç" ve "Ocağı Kapat" kritik basamaklar. */
export function teaPreparationSkill(): Skill {
  const skill = skillId("tea-preparation");
  const steps = [
    createStep({ id: stepId("tea-1"), skillId: skill, order: 1, name: "Su Doldur", description: "", isCritical: false }),
    createStep({ id: stepId("tea-2"), skillId: skill, order: 2, name: "Ocağı Aç", description: "", isCritical: true }),
    createStep({ id: stepId("tea-3"), skillId: skill, order: 3, name: "Çayı Demle", description: "", isCritical: false }),
    createStep({ id: stepId("tea-4"), skillId: skill, order: 4, name: "Ocağı Kapat", description: "", isCritical: true }),
    createStep({ id: stepId("tea-5"), skillId: skill, order: 5, name: "Servis Et", description: "", isCritical: false })
  ];
  return createSkill({ id: skill, name: "Çay Hazırlama", domain: "Bağımsız Yaşam", steps });
}

let counter = 0;

export function makeSession(params: {
  skill: Skill;
  studentId: StudentID;
  environment?: Environment;
  observedAt: Date;
  states: Partial<Record<string, AssessmentStateID>>;
}): AssessmentSession {
  const observations = params.skill.steps
    .map((step) => {
      const state = params.states[step.id as string];
      if (!state) return undefined;
      counter += 1;
      return { id: observationId(`obs-${counter}`), stepId: step.id, state };
    })
    .filter((o): o is NonNullable<typeof o> => !!o);

  return {
    id: sessionId(`session-${++counter}`),
    skillId: params.skill.id,
    studentId: params.studentId,
    environment: params.environment ?? "Okul",
    observations,
    observedAt: params.observedAt
  };
}

export function allIndependentExcept(skill: Skill, failing: readonly string[], failedState: AssessmentStateID, independentState: AssessmentStateID): Record<string, AssessmentStateID> {
  const states: Record<string, AssessmentStateID> = {};
  for (const step of skill.steps) {
    states[step.id as string] = failing.includes(step.id as string) ? failedState : independentState;
  }
  return states;
}

export type { StepID };
