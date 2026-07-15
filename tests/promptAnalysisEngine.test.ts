import { describe, expect, it } from "vitest";
import { ConfigurationManager } from "../src/config/index.js";
import { PromptAnalysisEngine, ScoringEngine } from "../src/core/index.js";
import { DefaultAssessmentStates, studentId } from "../src/domain/index.js";
import { handWashingSkill, makeSession } from "./fixtures.js";

describe("PromptAnalysisEngine", () => {
  it("counts prompts by type and computes dependency index", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const scoringEngine = new ScoringEngine(config);
    const engine = new PromptAnalysisEngine(config);
    const sid = studentId("s1");

    const states: Record<string, string> = {
      "hw-1": DefaultAssessmentStates.independent,
      "hw-2": DefaultAssessmentStates.verbalPrompt,
      "hw-3": DefaultAssessmentStates.verbalPrompt,
      "hw-4": DefaultAssessmentStates.modeling,
      "hw-5": DefaultAssessmentStates.physicalPrompt,
      "hw-6": DefaultAssessmentStates.failed,
      "hw-7": DefaultAssessmentStates.notObserved,
      "hw-8": DefaultAssessmentStates.exempt
    };

    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states: states as never });
    const stepScores = scoringEngine.stepScores(skill, session);
    const profile = engine.analyze(stepScores);

    expect(profile.totalPrompts).toBe(4);
    expect(profile.countsByType.get(DefaultAssessmentStates.verbalPrompt)).toBe(2);
    expect(profile.countsByType.get(DefaultAssessmentStates.modeling)).toBe(1);
    expect(profile.countsByType.get(DefaultAssessmentStates.physicalPrompt)).toBe(1);
    expect(profile.mostFrequentPromptType).toBe(DefaultAssessmentStates.verbalPrompt);

    // weighted = (1*2 + 3*1 + 4*1) / 4 = 2.25
    expect(profile.promptDependencyIndex).toBeCloseTo(2.25, 3);
  });

  it("zero prompts yields zero dependency index", () => {
    const skill = handWashingSkill();
    const config = ConfigurationManager.default();
    const scoringEngine = new ScoringEngine(config);
    const engine = new PromptAnalysisEngine(config);
    const sid = studentId("s1");

    const states = Object.fromEntries(skill.steps.map((s) => [s.id as string, DefaultAssessmentStates.independent]));
    const session = makeSession({ skill, studentId: sid, observedAt: new Date(), states });
    const stepScores = scoringEngine.stepScores(skill, session);
    const profile = engine.analyze(stepScores);

    expect(profile.totalPrompts).toBe(0);
    expect(profile.promptDependencyIndex).toBe(0);
    expect(profile.mostFrequentPromptType).toBeUndefined();
  });
});
