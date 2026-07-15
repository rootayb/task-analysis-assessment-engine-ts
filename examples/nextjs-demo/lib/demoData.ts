import {
  AssessmentEngine,
  ConfigurationManager,
  DefaultAssessmentStates,
  createSkill,
  createStep,
  observationId,
  sessionId,
  skillId,
  stepId,
  studentId,
  type AssessmentSession,
  type AssessmentStateID,
  type Skill
} from "task-analysis-assessment-engine";

function handWashingSkill(): Skill {
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

function session(skill: Skill, sid: ReturnType<typeof studentId>, observedAt: Date, states: Record<string, AssessmentStateID>): AssessmentSession {
  let counter = 0;
  const observations = skill.steps
    .map((step) => {
      const state = states[step.id as string];
      if (!state) return undefined;
      counter += 1;
      return { id: observationId(`obs-${observedAt.getTime()}-${counter}`), stepId: step.id, state };
    })
    .filter((o): o is NonNullable<typeof o> => !!o);

  return {
    id: sessionId(`session-${observedAt.getTime()}`),
    skillId: skill.id,
    studentId: sid,
    environment: "Okul",
    observations,
    observedAt
  };
}

export function buildDemoReport() {
  const skill = handWashingSkill();
  const config = ConfigurationManager.default();
  const engine = new AssessmentEngine(config);
  const sid = studentId("demo-student");

  const base = new Date("2026-01-01T00:00:00Z");
  const day = 86400000;

  function allIndependentExcept(failing: readonly string[]): Record<string, AssessmentStateID> {
    const states: Record<string, AssessmentStateID> = {};
    for (const step of skill.steps) {
      states[step.id as string] = failing.includes(step.id as string) ? DefaultAssessmentStates.failed : DefaultAssessmentStates.independent;
    }
    return states;
  }

  // 1 Ocak %40 civarı -> 22 Ocak %81 civarı ilerleme; "Sabun Alma" (hw-3) tekrar eden hata.
  const sessions = [
    session(skill, sid, base, {
      ...allIndependentExcept(["hw-3", "hw-5", "hw-6", "hw-7", "hw-8"]),
      "hw-4": DefaultAssessmentStates.verbalPrompt
    }),
    session(skill, sid, new Date(base.getTime() + 7 * day), {
      ...allIndependentExcept(["hw-3", "hw-7"]),
      "hw-6": DefaultAssessmentStates.gesturePrompt
    }),
    session(skill, sid, new Date(base.getTime() + 14 * day), {
      ...allIndependentExcept(["hw-3"]),
      "hw-7": DefaultAssessmentStates.verbalPrompt
    }),
    session(skill, sid, new Date(base.getTime() + 21 * day), allIndependentExcept(["hw-3"]))
  ];

  const report = engine.generateReport(skill, sid, sessions);
  if (!report) throw new Error("Rapor üretilemedi");
  return { report, skill };
}
