import { describe, expect, it } from "vitest";
import { ConfigurationManager } from "../src/config/index.js";
import { ScoringEngine } from "../src/core/index.js";
import { DefaultAssessmentStates, studentId } from "../src/domain/index.js";
import { handWashingSkill, makeSession } from "./fixtures.js";

describe("ScoringEngine", () => {
  it("all independent yields full success rate", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const engine = new ScoringEngine(config);
    const sid = studentId("s1");

    const states = Object.fromEntries(skill.steps.map((s) => [s.id as string, DefaultAssessmentStates.independent]));
    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });

    const stepScores = engine.stepScores(skill, session);
    expect(engine.successRate(skill, stepScores)).toBeCloseTo(100, 3);

    const counters = engine.counters(skill, stepScores);
    expect(counters.independentSteps).toBe(8);
    expect(counters.independenceRatio).toBeCloseTo(1, 3);
  });

  it("notObserved is excluded from evaluated and average", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const engine = new ScoringEngine(config);
    const sid = studentId("s1");

    const states = Object.fromEntries(skill.steps.map((s) => [s.id as string, DefaultAssessmentStates.independent]));
    states["hw-8"] = DefaultAssessmentStates.notObserved;
    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });

    const stepScores = engine.stepScores(skill, session);
    const counters = engine.counters(skill, stepScores);

    expect(counters.evaluatedSteps).toBe(7);
    expect(counters.totalSteps).toBe(8);
    expect(engine.successRate(skill, stepScores)).toBeCloseTo(100, 3);
  });

  it("exempt is excluded from scorable but not from evaluated", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const engine = new ScoringEngine(config);
    const sid = studentId("s1");

    const states = Object.fromEntries(skill.steps.map((s) => [s.id as string, DefaultAssessmentStates.independent]));
    states["hw-8"] = DefaultAssessmentStates.exempt;
    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });

    const stepScores = engine.stepScores(skill, session);
    const counters = engine.counters(skill, stepScores);

    expect(counters.evaluatedSteps).toBe(8);
    expect(counters.scorableSteps).toBe(7);
  });

  it("mixed states produce weighted success rate", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const engine = new ScoringEngine(config);
    const sid = studentId("s1");

    const states: Record<string, typeof DefaultAssessmentStates.independent> = {};
    for (let i = 1; i <= 6; i++) states[`hw-${i}`] = DefaultAssessmentStates.independent;
    states["hw-7"] = DefaultAssessmentStates.verbalPrompt;
    states["hw-8"] = DefaultAssessmentStates.failed;

    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });
    const stepScores = engine.stepScores(skill, session);

    // (6*100 + 80 + 0) / 800 * 100 = 85
    expect(engine.successRate(skill, stepScores)).toBeCloseTo(85, 3);
  });
});
