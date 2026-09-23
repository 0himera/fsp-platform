import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { competitionKeys } from "@/entities/competition";
import type { Team } from "@/shared/api";

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      name,
      memberIds,
    }: {
      competitionId: string | number;
      name: string;
      memberIds: number[];
    }) =>
      apiClient.post<Team>(`/api/competitions/${competitionId}/teams`, {
        name,
        member_ids: memberIds,
      }),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({
        queryKey: competitionKeys.detail(competitionId),
      });
    },
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      teamId,
    }: {
      competitionId: string | number;
      teamId: number;
    }) => apiClient.delete(`/api/competitions/${competitionId}/teams/${teamId}`),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({
        queryKey: competitionKeys.detail(competitionId),
      });
    },
  });
}
