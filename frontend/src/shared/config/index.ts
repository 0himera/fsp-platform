export const APP_CONFIG = {
  appName: "Цифровая платформа ФСП РД",
  shortName: "Арена ФСП РД",
  festival: "ТехноСпортФест – 2026",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "",
  stage: "Дистанционный этап — Кейс № 1",
  supportEmail: "Fsprd@mail.ru",
  location: "Республика Дагестан, Махачкала",
} as const;

export const COMPETITION_LEVELS: Record<string, string> = {
  rf_championship: "Чемпионат / Кубок России",
  all_russian: "Всероссийское соревнование",
  interregional: "Межрегиональное соревнование",
  rd_championship: "Чемпионат / Кубок Дагестана",
  regional: "Региональное соревнование",
};

export const SPORT_RANKS_MAP: Record<string, string> = {
  none: "Без разряда",
  III: "III разряд",
  II: "II разряд",
  I: "I разряд",
  KMS: "КМС",
  MS: "МС",
  MSMK: "МСМК",
  ZMS: "ЗМС",
};

export const COMPETITION_STATUSES: Record<string, string> = {
  draft: "Черновик",
  open: "Регистрация открыта",
  running: "Идёт соревнование",
  completed: "Завершено",
};

export const COMPETITION_STAGES: Record<string, string> = {
  standalone: "Отдельный зачёт",
  qualification: "Отбор",
  final: "Финал",
};

export const SPORT_DISCIPLINES = [
  "Алгоритмическое программирование",
  "Продуктовое программирование",
  "Программирование систем информационной безопасности",
  "Программирование робототехники",
  "Программирование беспилотных авиационных систем",
] as const;

export const SPORT_RANKS = [
  "Без разряда",
  "III разряд",
  "II разряд",
  "I разряд",
  "Кандидат в мастера спорта (КМС)",
  "Мастер спорта России (МС)",
  "МСМК",
  "ЗМС",
] as const;

