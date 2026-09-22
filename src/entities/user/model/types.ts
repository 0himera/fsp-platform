export type UserRole = "athlete" | "organizer" | "admin";

export type SportDiscipline =
  | "Программирование продуктовое"
  | "Программирование алгоритмическое"
  | "Программирование робототехники"
  | "Программирование систем информационной безопасности";

export type SportRank =
  | "Без разряда"
  | "III юношеский разряд"
  | "II юношеский разряд"
  | "I юношеский разряд"
  | "III спортивный разряд"
  | "II спортивный разряд"
  | "I спортивный разряд"
  | "Кандидат в мастера спорта (КМС)"
  | "Мастер спорта России (МС)";

export interface CompetitionHistoryItem {
  id: string;
  name: string;
  level: "Региональный" | "Всероссийский" | "Межрегиональный";
  discipline: SportDiscipline;
  date: string;
  place: number;
  pointsEarned: number;
}

export interface AthleteProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organization: string;
  city: string;
  disciplines: SportDiscipline[];
  rank: SportRank;
  rating: number;
  regionalRank: number;
  competitions: CompetitionHistoryItem[];
}
