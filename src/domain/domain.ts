export const DOMAINS = [
  "Dil",
  "Sosyal",
  "Akademik",
  "Motor",
  "Özbakım",
  "Bağımsız Yaşam",
  "İletişim",
  "Bilişsel"
] as const;

export type Domain = (typeof DOMAINS)[number];

export const ENVIRONMENTS = ["Okul", "Ev", "Bahçe", "Rehabilitasyon", "Diğer"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];
