export interface ProgressPoint {
  readonly date: Date;
  readonly successRate: number;
}

export const PROGRESS_STATUSES = ["İlerliyor", "Durgunluk", "Gerileme", "Yetersiz Veri"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export interface ProgressResult {
  readonly points: readonly ProgressPoint[];
  readonly weeklyGrowth?: number;
  readonly monthlyGrowth?: number;
  /** En küçük kareler regresyon eğimi (puan/gün). */
  readonly averageGrowth?: number;
  readonly status: ProgressStatus;
  readonly consecutiveStagnantSessions: number;
}
