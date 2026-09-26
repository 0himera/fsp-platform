import type { ContestTask, ContestSubmission } from "@/shared/api";

export type BottomTab = "result" | "history";

export interface SolveTaskState {
  task?: ContestTask;
  code: string;
  setCode: (code: string) => void;
  resetCode: () => void;
  submitting: boolean;
  handleSubmit: () => void;
  lastSubmission?: ContestSubmission;
  submissions: ContestSubmission[];
  activeTab: BottomTab;
  setActiveTab: (tab: BottomTab) => void;
}
