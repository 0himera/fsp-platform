import type { Competition } from "./competition-base";

export interface Registration {
  athlete_id: number;
  full_name: string;
  organization: string;
  city: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  members: Registration[];
}

export interface CompetitionResult {
  id?: number;
  athlete_id?: number;
  team_id?: number;
  place: number;
  score_text: string;
  name?: string;
}

export interface CompetitionDetail {
  competition: Competition;
  registrations: Registration[];
  teams: Team[];
  results: CompetitionResult[];
  registered: boolean;
}
