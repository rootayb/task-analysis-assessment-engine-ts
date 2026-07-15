import { describe, expect, it } from "vitest";
import { ConfigurationManager } from "../src/config/index.js";
import { AssessmentEngine } from "../src/core/index.js";
import { DefaultAssessmentStates, createSkill, createStep, skillId, studentId } from "../src/domain/index.js";
import { allIndependentExcept, handWashingSkill, makeSession, teaPreparationSkill } from "./fixtures.js";

describe("AssessmentEngine", () => {
  it("generates an explainable report for hand washing", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const fixedNow = new Date();
    const engine = new AssessmentEngine(config, { now: () => fixedNow });
    const sid = studentId("s1");

    const base = new Date(0);
    const day = 86400000;
    const sessions = [
      makeSession({ skill, studentId: sid, observedAt: base, states: allIndependentExcept(skill, ["hw-3", "hw-7", "hw-8"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(base.getTime() + 7 * day), states: allIndependentExcept(skill, ["hw-3", "hw-8"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(base.getTime() + 14 * day), states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(base.getTime() + 21 * day), states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) })
    ];

    const report = engine.generateReport(skill, sid, sessions)!;

    expect(report.skillId).toBe(skill.id);
    expect(report.studentId).toBe(sid);
    expect(report.explanation.reasons.length).toBeGreaterThan(0);
    expect(report.explanation.mostErrorProneSteps[0]?.stepId).toBe("hw-3");
    expect(report.explanation.recommendedStepsToRetry).toContain("hw-3");
    expect(report.progress.points).toHaveLength(4);
    expect(report.chartData.progressLine.length).toBeGreaterThan(0);
    expect(report.chartData.errorBar.length).toBeGreaterThan(0);
    expect(report.configVersion).toBe(config.config.version);
  });

  it("caps level in full pipeline on critical failure", () => {
    const skill = teaPreparationSkill();
    const config = ConfigurationManager.default();
    const engine = new AssessmentEngine(config);
    const sid = studentId("s1");

    const states = allIndependentExcept(skill, ["tea-2"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent);
    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });
    const report = engine.generateReport(skill, sid, [session])!;

    expect(report.latestResult.criticalEvaluation.hasCriticalFailure).toBe(true);
    expect(report.latestResult.overallSuccessLevel).toBe("Gelişiyor");
    expect(report.latestResult.successRate).toBeGreaterThan(60);
    expect(report.explanation.reasons.some((r) => r.type === "criticalFailure")).toBe(true);
  });

  it("flags prompt on a non-promptable step during validation", () => {
    const skill = createSkill({
      id: skillId("electric-safety"),
      name: "Elektrik Güvenliği",
      domain: "Bağımsız Yaşam",
      steps: [
        createStep({
          id: "es-1" as never,
          skillId: skillId("electric-safety"),
          order: 1,
          name: "Elektrik Prizi",
          description: "",
          isCritical: true,
          promptsAllowed: false
        })
      ]
    });

    const config = ConfigurationManager.default();
    const engine = new AssessmentEngine(config);
    const sid = studentId("s1");

    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states: { "es-1": DefaultAssessmentStates.verbalPrompt } });
    const issues = engine.validate(skill, session);

    expect(issues.some((i) => i.severity === "warning" && i.relatedStepId === "es-1")).toBe(true);
  });
});
