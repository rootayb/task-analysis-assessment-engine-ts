import { describe, expect, it } from "vitest";
import { ConfigurationManager } from "../src/config/index.js";
import { ErrorAnalysisEngine, ScoringEngine } from "../src/core/index.js";
import { DefaultAssessmentStates, studentId } from "../src/domain/index.js";
import { allIndependentExcept, handWashingSkill, makeSession } from "./fixtures.js";

describe("ErrorAnalysisEngine", () => {
  it("finds most error-prone steps across sessions", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const scoringEngine = new ScoringEngine(config);
    const engine = new ErrorAnalysisEngine(config, scoringEngine);
    const sid = studentId("s1");
    const now = new Date();
    const day = 86400000;

    const sessions = [
      makeSession({ skill, studentId: sid, observedAt: new Date(now.getTime() - 4 * day), states: allIndependentExcept(skill, ["hw-3", "hw-7"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(now.getTime() - 3 * day), states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(now.getTime() - 2 * day), states: allIndependentExcept(skill, ["hw-3", "hw-8"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(now.getTime() - 1 * day), states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: now, states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) })
    ];

    const profile = engine.analyze(skill, sessions);

    expect(profile.errorCountsByStep.get("hw-3" as never)).toBe(5);
    expect(profile.errorCountsByStep.get("hw-7" as never)).toBe(1);
    expect(profile.errorCountsByStep.get("hw-8" as never)).toBe(1);
    expect(profile.mostErrorProneSteps[0]?.stepId).toBe("hw-3");
    expect(profile.mostErrorProneSteps[0]?.errorCount).toBe(5);
    expect(profile.errorRateByStep.get("hw-3" as never)).toBeCloseTo(1, 3);
  });

  it("only uses configured session window", () => {
    const skill = handWashingSkill();
    const baseConfig = ConfigurationManager.default().config;
    const config = new ConfigurationManager({ ...baseConfig, errorAnalysisSessionWindow: 2 });
    const scoringEngine = new ScoringEngine(config);
    const engine = new ErrorAnalysisEngine(config, scoringEngine);
    const sid = studentId("s1");
    const now = new Date();
    const day = 86400000;

    const sessions = [
      makeSession({ skill, studentId: sid, observedAt: new Date(now.getTime() - 10 * day), states: allIndependentExcept(skill, ["hw-8"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: new Date(now.getTime() - 1 * day), states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) }),
      makeSession({ skill, studentId: sid, observedAt: now, states: allIndependentExcept(skill, ["hw-3"], DefaultAssessmentStates.failed, DefaultAssessmentStates.independent) })
    ];

    const profile = engine.analyze(skill, sessions);
    expect(profile.errorCountsByStep.get("hw-8" as never)).toBeUndefined();
    expect(profile.errorCountsByStep.get("hw-3" as never)).toBe(2);
  });
});
