export interface Achievement {
  code: string;
  title: string;
  description: string;
  kind: "first" | "win" | "podium" | "final" | "series";
  date: string;
}

export interface RankChange {
  id: number;
  old_rank_code: string;
  new_rank_code: string;
  changed_by: number;
  changed_at: string;
}
