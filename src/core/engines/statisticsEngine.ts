import type { Domain, DomainStatistics, Skill } from "../../domain/index.js";

export interface StatsSummary {
  readonly mean: number;
  readonly median: number;
  readonly standardDeviation: number;
  readonly minimum: number;
  readonly maximum: number;
}

export interface SkillSuccessSample {
  readonly skill: Skill;
  readonly successRate: number;
}

/** Basamak/beceri bazlı özet istatistikler ve radar grafiği için alan-bazlı toplulaştırma. */
export class StatisticsEngine {
  summary(values: readonly number[]): StatsSummary | undefined {
    if (values.length === 0) return undefined;

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;

    return {
      mean,
      median,
      standardDeviation: Math.sqrt(variance),
      minimum: sorted[0] ?? 0,
      maximum: sorted[sorted.length - 1] ?? 0
    };
  }

  /** Radar grafik için: aynı alandaki (Domain) becerilerin ortalama başarı oranı. */
  domainStatistics(samples: readonly SkillSuccessSample[]): DomainStatistics[] {
    const grouped = new Map<Domain, number[]>();
    for (const sample of samples) {
      const list = grouped.get(sample.skill.domain) ?? [];
      list.push(sample.successRate);
      grouped.set(sample.skill.domain, list);
    }

    return [...grouped.entries()]
      .map(([domain, rates]) => ({
        domain,
        averageSuccessRate: rates.reduce((s, r) => s + r, 0) / rates.length,
        skillCount: rates.length
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain));
  }
}
