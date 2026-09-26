import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { CodeforcesLinkedData, CodeforcesUser } from "../model/types";

export const codeforcesKeys = {
  all: ["codeforces"] as const,
  contest: (id: number) => [...codeforcesKeys.all, "contest", id] as const,
  user: (handle: string) => [...codeforcesKeys.all, "user", handle] as const,
};

export function useCodeforcesContestQuery(competitionId: number, enabled = true) {
  return useQuery({
    queryKey: codeforcesKeys.contest(competitionId),
    queryFn: () => apiClient.get<CodeforcesLinkedData>(`/api/competitions/${competitionId}/codeforces`),
    enabled: enabled && competitionId > 0,
  });
}

export function useLinkCodeforcesMutation(competitionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contestId: number) =>
      apiClient.post(`/api/competitions/${competitionId}/codeforces/link`, { contest_id: contestId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: codeforcesKeys.contest(competitionId) });
      qc.invalidateQueries({ queryKey: ["contests", "detail", competitionId] });
    },
  });
}

export function useImportCodeforcesTasksMutation(competitionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ imported: number }>(`/api/competitions/${competitionId}/codeforces/import-tasks`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contests", "detail", competitionId] });
      qc.invalidateQueries({ queryKey: codeforcesKeys.contest(competitionId) });
    },
  });
}

export function useSyncCodeforcesStandingsMutation(competitionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ synced: number }>(`/api/competitions/${competitionId}/codeforces/sync`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contests", "leaderboard", competitionId] });
      qc.invalidateQueries({ queryKey: ["contests", "submissions", competitionId] });
    },
  });
}

export function useCodeforcesUserQuery(handle?: string) {
  return useQuery({
    queryKey: codeforcesKeys.user(handle ?? ""),
    queryFn: () => apiClient.get<CodeforcesUser>(`/api/codeforces/user/${handle}`),
    enabled: Boolean(handle && handle.trim().length > 0),
  });
}
