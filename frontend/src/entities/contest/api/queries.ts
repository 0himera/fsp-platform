import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Contest, ContestLeader, ContestSubmission } from "@/shared/api";

export const contestKeys = {
  root: (id: number) => ["contest", id] as const,
  detail: (id: number) => [...contestKeys.root(id), "detail"] as const,
  submissions: (id: number) => [...contestKeys.root(id), "submissions"] as const,
  leaderboard: (id: number) => [...contestKeys.root(id), "leaderboard"] as const,
};

export function useContestQuery(id: number) {
  return useQuery({
    queryKey: contestKeys.detail(id),
    queryFn: () => apiClient.get<Contest>(`/api/competitions/${id}/contest`),
    enabled: id > 0,
    retry: false,
  });
}

export function useContestSubmissionsQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: contestKeys.submissions(id),
    queryFn: () => apiClient.get<ContestSubmission[]>(`/api/competitions/${id}/contest/submissions`),
    enabled,
    refetchInterval: 5000,
  });
}

export function useContestLeaderboardQuery(id: number, enabled: boolean) {
  return useQuery({
    queryKey: contestKeys.leaderboard(id),
    queryFn: () => apiClient.get<ContestLeader[]>(`/api/competitions/${id}/contest/leaderboard`),
    enabled,
    refetchInterval: enabled ? 10000 : false,
  });
}
