import type { User, Athlete, AthleteResult, MeResponse, UserRole, RankCode } from "@/shared/api";
import { SPORT_RANKS_MAP } from "@/shared/config";

export type { User, Athlete, AthleteResult, MeResponse, UserRole, RankCode };

export type SportDiscipline = string;
export type SportRank = string;

export interface CompetitionHistoryItem {
  id: string;
  name: string;
  level: string;
  discipline: string;
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
  disciplines: string[];
  rank: string;
  rating: number;
  regionalRank: number;
  competitions: CompetitionHistoryItem[];
  raw?: Athlete;
}

export function toAthleteProfile(a: Athlete, email = ""): AthleteProfile {
  return {
    id: String(a.id),
    fullName: a.full_name,
    email,
    role: "athlete",
    organization: a.organization || "—",
    city: a.city || "Дагестан",
    disciplines: a.disciplines || [],
    rank: SPORT_RANKS_MAP[a.rank_code] || a.rank_code || "Без разряда",
    rating: a.rating || 0,
    regionalRank: a.rating_place || 1,
    competitions: (a.results || []).map((r) => ({
      id: String(r.competition_id),
      name: r.competition,
      level: r.level,
      discipline: r.discipline,
      date: r.ends_at,
      place: r.place,
      pointsEarned: r.points,
    })),
    raw: a,
  };
}

