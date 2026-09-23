import type { Athlete } from "./user";

export interface RankingsResponse {
  athletes: Athlete[];
  as_of: string;
}

export interface Discipline {
  code: string;
  name: string;
}
