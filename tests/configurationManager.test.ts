import { describe, expect, it } from "vitest";
import { ConfigurationError, ConfigurationManager, defaultAssessmentConfig } from "../src/config/index.js";
import { DefaultAssessmentStates } from "../src/domain/index.js";

describe("ConfigurationManager", () => {
  it("default config is valid", () => {
    expect(() => new ConfigurationManager(defaultAssessmentConfig())).not.toThrow();
  });

  it("throws on empty states", () => {
    const config = { ...defaultAssessmentConfig(), states: [] };
    expect(() => new ConfigurationManager(config)).toThrow(ConfigurationError);
  });

  it("throws on duplicate state id", () => {
    const config = defaultAssessmentConfig();
    const invalid = { ...config, states: [...config.states, { id: DefaultAssessmentStates.independent, name: "Dup", order: 99, rawScore: 100 }] };
    expect(() => new ConfigurationManager(invalid)).toThrow(ConfigurationError);
  });

  it("throws on unknown failure state reference", () => {
    const config = defaultAssessmentConfig();
    const invalid = { ...config, failureStates: [...config.failureStates, "ghost-state" as never] };
    expect(() => new ConfigurationManager(invalid)).toThrow(ConfigurationError);
  });

  it("throws on invalid threshold ordering", () => {
    const config = defaultAssessmentConfig();
    const invalid = { ...config, thresholds: { ...config.thresholds, veryLowUpperBound: 10 } };
    expect(() => new ConfigurationManager(invalid)).toThrow(ConfigurationError);
  });

  it("JSON round-trip matches default", () => {
    const original = defaultAssessmentConfig();
    const manager = ConfigurationManager.fromJSON(JSON.stringify(original));

    expect(manager.config.version).toBe(original.version);
    expect(manager.config.states).toHaveLength(original.states.length);
    expect(manager.config.independentStateId).toBe(original.independentStateId);
    expect(manager.config.promptWeights).toEqual(original.promptWeights);
  });
});
