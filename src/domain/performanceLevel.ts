/** Eşikler config'ten okunur (bkz. core/engines/performanceLevelClassifier.ts). */
export const PERFORMANCE_LEVELS = ["Başlanmadı", "Çok Düşük", "Gelişiyor", "İyi", "Çok İyi", "Bağımsız"] as const;

export type PerformanceLevel = (typeof PERFORMANCE_LEVELS)[number];

const ORDER: Record<PerformanceLevel, number> = {
  Başlanmadı: 0,
  "Çok Düşük": 1,
  Gelişiyor: 2,
  İyi: 3,
  "Çok İyi": 4,
  Bağımsız: 5
};

export function comparePerformanceLevel(a: PerformanceLevel, b: PerformanceLevel): number {
  return ORDER[a] - ORDER[b];
}

export function minPerformanceLevel(a: PerformanceLevel, b: PerformanceLevel): PerformanceLevel {
  return comparePerformanceLevel(a, b) <= 0 ? a : b;
}
