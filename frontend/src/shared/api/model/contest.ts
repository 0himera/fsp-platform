export type ContestMode = "algorithm" | "csv_metric";

export interface ContestTask {
  id: number;
  title: string;
  statement: string;
  max_points: number;
  position: number;
  public_csv?: string;
}

export interface Contest {
  competition_id: number;
  mode: ContestMode;
  instructions: string;
  finalized: boolean;
  tasks: ContestTask[];
}

export interface ContestSubmission {
  id: number;
  task_id: number;
  task_title: string;
  athlete_id: number;
  athlete_name?: string;
  language?: string;
  source_code?: string;
  file_name?: string;
  file_content?: string;
  status: "submitted" | "queued" | "checking" | "graded" | "invalid";
  automatic_score?: number;
  score?: number;
  verdict: string;
  feedback: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface ContestTaskResult {
  task_id: number;
  title: string;
  score: number;
  attempts: number;
}

export interface ContestLeader {
  athlete_id: number;
  full_name: string;
  place: number;
  score: number;
  max_score: number;
  total_attempts: number;
  tasks: ContestTaskResult[];
}

