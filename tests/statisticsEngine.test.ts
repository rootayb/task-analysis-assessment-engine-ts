import { describe, expect, it } from "vitest";
import { StatisticsEngine } from "../src/core/index.js";
import { handWashingSkill, teaPreparationSkill } from "./fixtures.js";

describe("StatisticsEngine", () => {
  it("computes mean, median, stddev", () => {
    const engine = new StatisticsEngine();
    const summary = engine.summary([40, 55, 72, 81])!;

    expect(summary.mean).toBeCloseTo(62, 3);
    expect(summary.median).toBeCloseTo(63.5, 3);
    expect(summary.minimum).toBe(40);
    expect(summary.maximum).toBe(81);
    expect(summary.standardDeviation).toBeGreaterThan(0);
  });

  it("returns undefined for empty input", () => {
    const engine = new StatisticsEngine();
    expect(engine.summary([])).toBeUndefined();
  });

  it("groups domain statistics by domain", () => {
    const engine = new StatisticsEngine();
    const handWashing = handWashingSkill(); // Özbakım
    const tea = teaPreparationSkill(); // Bağımsız Yaşam

    const stats = engine.domainStatistics([
      { skill: handWashing, successRate: 80 },
      { skill: tea, successRate: 60 }
    ]);

    expect(stats).toHaveLength(2);
    expect(stats.some((s) => s.domain === "Özbakım" && s.averageSuccessRate === 80)).toBe(true);
    expect(stats.some((s) => s.domain === "Bağımsız Yaşam" && s.averageSuccessRate === 60)).toBe(true);
  });
});
