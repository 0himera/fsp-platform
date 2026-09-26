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
