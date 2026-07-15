import { describe, expect, it } from "vitest";
import { ConfigurationManager } from "../src/config/index.js";
import { ProgressEngine } from "../src/core/index.js";

describe("ProgressEngine", () => {
  it("insufficient data with fewer than two points", () => {
    const config = ConfigurationManager.default();
    const engine = new ProgressEngine(config);

    const result = engine.analyze([{ date: new Date(), successRate: 50 }]);
    expect(result.status).toBe("Yetersiz Veri");
    expect(result.averageGrowth).toBeUndefined();
  });

  it("detects improving trend", () => {
    const config = ConfigurationManager.default();
    const engine = new ProgressEngine(config);
    const base = new Date(0);
    const day = 86400000;

    const points = [
      { date: base, successRate: 40 },
      { date: new Date(base.getTime() + 7 * day), successRate: 55 },
      { date: new Date(base.getTime() + 14 * day), successRate: 72 },
      { date: new Date(base.getTime() + 21 * day), successRate: 81 }
    ];

    const result = engine.analyze(points);
    expect(result.status).toBe("İlerliyor");
    expect(result.averageGrowth).toBeGreaterThan(0.5);
    expect(result.weeklyGrowth).toBeCloseTo((81 - 72) / 7, 3);
  });

  it("detects plateau with flat scores", () => {
    const config = ConfigurationManager.default();
    const engine = new ProgressEngine(config);
    const base = new Date(0);
    const day = 86400000;

    const points = [0, 1, 2, 3].map((i) => ({ date: new Date(base.getTime() + i * 7 * day), successRate: 60 }));

    const result = engine.analyze(points);
    expect(result.status).toBe("Durgunluk");
    expect(result.consecutiveStagnantSessions).toBe(3);
  });

  it("detects regressing trend", () => {
    const config = ConfigurationManager.default();
    const engine = new ProgressEngine(config);
    const base = new Date(0);
    const day = 86400000;

    const points = [
      { date: base, successRate: 80 },
      { date: new Date(base.getTime() + 7 * day), successRate: 65 },
      { date: new Date(base.getTime() + 14 * day), successRate: 50 }
    ];

    const result = engine.analyze(points);
    expect(result.status).toBe("Gerileme");
  });
});
