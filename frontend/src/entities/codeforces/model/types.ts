export interface CodeforcesProblem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  points: number;
  rating?: number;
  tags: string[];
}

export interface CodeforcesContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
}

export interface CodeforcesRow {
  party: {
    members: { handle: string }[];
  };
  rank: number;
  points: number;
  penalty: number;
  problemResults?: {
    points: number;
    rejectedAttemptCount: number;
  }[];
}

export interface CodeforcesStandings {
  contest: CodeforcesContest;
  problems: CodeforcesProblem[];
  rows: CodeforcesRow[];
}

export interface CodeforcesLinkedData {
  linked: boolean;
  contest_id?: number;
  standings?: CodeforcesStandings;
}

export interface CodeforcesUser {
  handle: string;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  avatar: string;
}
