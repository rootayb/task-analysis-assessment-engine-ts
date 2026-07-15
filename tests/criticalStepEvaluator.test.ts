import { describe, expect, it } from "vitest";
import { ConfigurationManager } from "../src/config/index.js";
import { CriticalStepEvaluator, ScoringEngine, classifyPerformanceLevel } from "../src/core/index.js";
import { DefaultAssessmentStates, comparePerformanceLevel, studentId } from "../src/domain/index.js";
import { makeSession, teaPreparationSkill } from "./fixtures.js";

describe("CriticalStepEvaluator", () => {
  it("caps level when critical step fails despite high success rate", () => {
    const skill = teaPreparationSkill();
    const config = ConfigurationManager.default();
    const scoringEngine = new ScoringEngine(config);
    const evaluator = new CriticalStepEvaluator(config);
    const sid = studentId("s1");

    const states = Object.fromEntries(skill.steps.map((s) => [s.id as string, DefaultAssessmentStates.independent]));
    states["tea-2"] = DefaultAssessmentStates.failed;

    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });
    const stepScores = scoringEngine.stepScores(skill, session);
    const successRate = scoringEngine.successRate(skill, stepScores);

    const criticalEvaluation = evaluator.evaluate(skill, stepScores);
    expect(criticalEvaluation.hasCriticalFailure).toBe(true);
    expect(criticalEvaluation.failedCriticalSteps).toEqual(["tea-2"]);
    expect(successRate).toBeGreaterThan(60);

    const rawLevel = classifyPerformanceLevel(successRate, config.config.thresholds);
    const cappedLevel = evaluator.capLevel(rawLevel, criticalEvaluation);
    expect(cappedLevel).toBe("Gelişiyor");
    expect(comparePerformanceLevel(cappedLevel, rawLevel)).toBeLessThan(0);
  });

  it("does not cap level when there is no critical failure", () => {
    const skill = teaPreparationSkill();
    const config = ConfigurationManager.default();
    const scoringEngine = new ScoringEngine(config);
    const evaluator = new CriticalStepEvaluator(config);
    const sid = studentId("s1");

    const states = Object.fromEntries(skill.steps.map((s) => [s.id as string, DefaultAssessmentStates.independent]));
    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });
    const stepScores = scoringEngine.stepScores(skill, session);

    const criticalEvaluation = evaluator.evaluate(skill, stepScores);
    expect(criticalEvaluation.hasCriticalFailure).toBe(false);
    expect(evaluator.capLevel("Bağımsız", criticalEvaluation)).toBe("Bağımsız");
  });
});
