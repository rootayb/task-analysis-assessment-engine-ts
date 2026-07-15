import type { Domain } from "./domain.js";

/** Framework-bağımsız grafik veri noktası. Bu motor grafik çizmez, yalnızca veri üretir. */
export interface ChartDataPoint {
  readonly label: string;
  readonly value: number;
  readonly category?: string;
}

export interface ChartDataBundle {
  readonly progressLine: readonly ChartDataPoint[];
  readonly errorBar: readonly ChartDataPoint[];
  readonly promptPie: readonly ChartDataPoint[];
}

export interface DomainStatistics {
  readonly domain: Domain;
  readonly averageSuccessRate: number;
  readonly skillCount: number;
}
