import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type CreateTeamResponse } from "@/shared/api";
import { competitionKeys } from "@/entities/competition";

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      name,
      description,
    }: {
      competitionId: string | number;
      name: string;
      description?: string;
    }) =>
      apiClient.post<CreateTeamResponse>(`/api/competitions/${competitionId}/teams`, {
        name,
        description,
      }),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
      queryClient.invalidateQueries({ queryKey: competitionKeys.myRegistrations() });
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
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
      queryClient.invalidateQueries({ queryKey: competitionKeys.myRegistrations() });
    },
  });
}
