import type { Competition } from "./competition-base";
import type { Achievement } from "./achievement";

export interface Registration {
  athlete_id: number;
  full_name: string;
  organization: string;
  city: string;
  created_at: string;
  avatar_url?: string;
  featured_achievement?: Achievement | null;
}

export interface CompetitionParticipant {
  athlete_id: number;
  full_name: string;
  avatar_url: string;
  featured_achievement?: Achievement | null;
}

export interface Team {
  competition_id?: number;
  id: number;
  name: string;
  description?: string;
  captain_id?: number;
  members: Registration[];
}

export interface CreateTeamResponse {
  team: Team;
  invite_url: string;
}

export interface ResultPublication {
  id: number;
  published_at: string;
  publisher: string;
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
