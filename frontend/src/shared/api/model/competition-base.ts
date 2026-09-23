export type CompetitionFormat = "individual" | "team";
export type CompetitionStatus = "draft" | "open" | "running" | "completed";
export type CompetitionPhase =
  | "draft"
  | "upcoming"
  | "current"
  | "awaiting_results"
  | "completed";
export type CompetitionStage = "standalone" | "qualification" | "final";

export interface Competition {
  id: number;
  title: string;
  level_code: string;
  discipline_code: string;
  format: CompetitionFormat;
  starts_at: string;
  ends_at: string;
  registration_deadline: string;
  location: string;
  description: string;
  status: CompetitionStatus;
  phase: CompetitionPhase;
  registration_open: boolean;
  stage: CompetitionStage;
  qualifying_competition_id?: number | null;
  qualifying_place_limit?: number | null;
  registrations_count: number;
  results_count: number;
}

export interface CreateCompetitionInput {
  title: string;
  level_code: string;
  discipline_code: string;
  format: CompetitionFormat;
  starts_at: string;
  ends_at: string;
  registration_deadline: string;
  location: string;
  description: string;
  status?: CompetitionStatus;
  stage?: CompetitionStage;
  qualifying_competition_id?: number | null;
  qualifying_place_limit?: number | null;
}
