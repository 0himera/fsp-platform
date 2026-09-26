export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
}

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type UserRole = "athlete" | "organizer" | "coach" | "judge";

export type RankCode = "none" | "III" | "II" | "I" | "KMS" | "MS" | "MSMK" | "ZMS";

export type CompetitionFormat = "individual" | "team";
export type CompetitionStatus = "draft" | "open" | "running" | "completed";
export type CompetitionPhase = "draft" | "upcoming" | "current" | "awaiting_results" | "completed";
export type CompetitionStage = "standalone" | "qualification" | "final";

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

export interface Achievement {
  code: string;
  title: string;
  description: string;
  kind: "first" | "win" | "podium" | "final" | "series";
  date: string;
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
  avatar_url: string;
  achievements: Achievement[];
  featured_achievement?: Achievement | null;
}

export interface MeResponse {
  user: User;
  athlete?: Athlete;
}

export interface Competition {
  id: number;
  title: string;
  level_code: string;
  discipline_code: string;
  format: CompetitionFormat;
  max_team_size: number;
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

export interface CreateTeamResponse {
  team: Team;
  invite_url: string;
}

export interface ResultPublication {
  id: number;
  published_at: string;
  publisher: string;
}

export interface Team {
  competition_id: number;
  id: number;
  name: string;
  description?: string;
  captain_id: number;
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

export interface RankingsResponse {
  athletes: Athlete[];
  as_of: string;
}

export interface Discipline {
  code: string;
  name: string;
}

export interface DocumentItem {
  id: number;
  competition_id?: number | null;
  title: string;
  url: string;
  file_size: number;
  created_at: string;
}

export interface CreateCompetitionInput {
  title: string;
  level_code: string;
  discipline_code: string;
  format: CompetitionFormat;
  max_team_size?: number;
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

// Rank history
export interface RankChange {
  id: number;
  old_rank_code: string;
  new_rank_code: string;
  changed_by: number;
  changed_at: string;
}

// Notification
export interface Notification {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

// Staff (coach/judge)
export interface StaffProfile {
  user_id: number;
  full_name: string;
  organization: string;
  city: string;
  bio: string;
  avatar_url: string;
  role: "coach" | "judge";
}

export interface JudgeEntry {
  user_id: number;
  full_name: string;
  role_note: string;
}

// AI Assistant
export interface AiMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface AiChatSource {
  title: string;
  content: string;
}

export interface AiChatResponse {
  answer: string;
  sources?: AiChatSource[];
}
