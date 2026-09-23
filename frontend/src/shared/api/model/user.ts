import type { UserRole, RankCode } from "./base";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name?: string;
  organization?: string;
  city?: string;
  created_at?: string;
}

export interface AthleteResult {
  competition_id: number;
  competition: string;
  discipline: string;
  level: string;
  stage: string;
  ends_at: string;
  place: number;
  score_text: string;
  finishers: number;
  base: number;
  place_factor: number;
  size_factor: number;
  relative_factor: number;
  decay: number;
  points: number;
  included: boolean;
}

export interface Athlete {
  id: number;
  full_name: string;
  city: string;
  organization: string;
  rank_code: RankCode;
  disciplines: string[];
  rating_place: number;
  rating: number;
  result_points: number;
  rank_base: number;
  activity_factor: number;
  rank_points: number;
  results: AthleteResult[];
  rules_version: string;
}

export interface MeResponse {
  user: User;
  athlete?: Athlete;
}
