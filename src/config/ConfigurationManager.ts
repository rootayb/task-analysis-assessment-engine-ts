import { defaultAssessmentConfig } from "./defaultConfig.js";
import type { AssessmentConfig } from "./types.js";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export interface ConfigProviding {
  readonly config: AssessmentConfig;
}

/**
 * Tüm puan/eşik/kritik kural parametrelerine tek noktadan erişim sağlayan bileşen.
 * Motorlar somut ConfigurationManager'a değil bu arayüze bağımlıdır.
 */
export class ConfigurationManager implements ConfigProviding {
  readonly config: AssessmentConfig;
  /** Hızlı erişim için önceden hesaplanmış durum → ham puan haritası. */
  readonly scoreMap: ReadonlyMap<string, number | undefined>;

  constructor(config: AssessmentConfig) {
    ConfigurationManager.validate(config);
    this.config = config;
    this.scoreMap = new Map(config.states.map((s) => [s.id as string, s.rawScore]));
  }

  static fromJSON(json: string): ConfigurationManager {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      throw new ConfigurationError(`Config JSON çözümlenemedi: ${(error as Error).message}`);
    }
    return new ConfigurationManager(parsed as AssessmentConfig);
  }

  static validate(config: AssessmentConfig): void {
    if (config.states.length === 0) {
      throw new ConfigurationError("AssessmentConfig.states boş olamaz");
    }

    const seen = new Set<string>();
    for (const state of config.states) {
      if (seen.has(state.id)) {
        throw new ConfigurationError(`Tekrarlanan durum id'si: ${state.id}`);
      }
      seen.add(state.id);
    }

    const checkRef = (field: string, id: string) => {
      if (!seen.has(id)) {
        throw new ConfigurationError(`${field} bilinmeyen bir durum id'si içeriyor: ${id}`);
      }
    };

    config.failureStates.forEach((id) => checkRef("failureStates", id));
    config.errorStates.forEach((id) => checkRef("errorStates", id));
    Object.keys(config.promptWeights).forEach((id) => checkRef("promptWeights", id));
    checkRef("independentStateId", config.independentStateId);
    checkRef("notObservedStateId", config.notObservedStateId);
    checkRef("exemptStateId", config.exemptStateId);

    const t = config.thresholds;
    if (
      !(
        t.notStartedUpperBound < t.veryLowUpperBound &&
        t.veryLowUpperBound < t.developingUpperBound &&
        t.developingUpperBound < t.goodUpperBound &&
        t.goodUpperBound < t.veryGoodUpperBound &&
        t.veryGoodUpperBound <= 100
      )
    ) {
      throw new ConfigurationError("Eşik değerleri sıralı olmalı: notStarted < veryLow < developing < good < veryGood <= 100");
    }

    if (config.errorAnalysisSessionWindow <= 0) {
      throw new ConfigurationError("errorAnalysisSessionWindow > 0 olmalı");
    }
    if (config.progressThresholds.plateauSessionCount <= 0) {
      throw new ConfigurationError("plateauSessionCount > 0 olmalı");
    }
  }

  static default(): ConfigurationManager {
    return new ConfigurationManager(defaultAssessmentConfig());
  }
}
