import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Contest, ContestTask, ContestMode } from "@/shared/api";
import { useRefreshContest } from "./refresh";

export function useCreateContestMutation(id: number) {
  const refresh = useRefreshContest(id);
  return useMutation({
    mutationFn: (input: { mode: ContestMode; instructions: string }) =>
      apiClient.post<Contest>(`/api/competitions/${id}/contest`, input),
    onSuccess: refresh,
  });
}

export function useCreateContestTaskMutation(id: number) {
  const refresh = useRefreshContest(id);
  return useMutation({
    mutationFn: (input: { title: string; statement: string; max_points: number; public_csv?: string; expected_labels?: Record<string, string> }) =>
      apiClient.post<ContestTask>(`/api/competitions/${id}/contest/tasks`, input),
    onSuccess: refresh,
  });
}
