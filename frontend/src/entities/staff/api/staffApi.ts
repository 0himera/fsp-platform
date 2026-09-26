import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { StaffProfile, JudgeEntry, RankChange } from "@/shared/api";

export const staffKeys = {
  all: ["staff"] as const,
  coaches: () => [...staffKeys.all, "coaches"] as const,
  coach: (id: number) => [...staffKeys.all, "coach", id] as const,
  athleteCoaches: (id: number) => [...staffKeys.all, "athlete-coaches", id] as const,
  competitionJudges: (id: number) => [...staffKeys.all, "competition-judges", id] as const,
};

export function useCoachesQuery() {
  return useQuery({
    queryKey: staffKeys.coaches(),
    queryFn: () => apiClient.get<StaffProfile[]>("/api/coaches"),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAthleteCoachesQuery(athleteId: number) {
  return useQuery({
    queryKey: staffKeys.athleteCoaches(athleteId),
    queryFn: () => apiClient.get<StaffProfile[]>(`/api/athletes/${athleteId}/coaches`),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(athleteId),
  });
}

export function useCompetitionJudgesQuery(competitionId: number) {
  return useQuery({
    queryKey: staffKeys.competitionJudges(competitionId),
    queryFn: () => apiClient.get<JudgeEntry[]>(`/api/competitions/${competitionId}/judges`),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(competitionId),
  });
}

export function useAddCompetitionJudgeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ competitionId, judgeId, roleNote }: { competitionId: number; judgeId: number; roleNote: string }) =>
      apiClient.post<JudgeEntry[]>(`/api/competitions/${competitionId}/judges`, {
        judge_id: judgeId,
        role_note: roleNote,
      }),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.competitionJudges(competitionId) });
    },
  });
}

export function useRankHistoryQuery(athleteId: number) {
  return useQuery({
    queryKey: ["rank-history", athleteId],
    queryFn: () => apiClient.get<RankChange[]>(`/api/athletes/${athleteId}/rank-history`),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(athleteId),
  });
}
