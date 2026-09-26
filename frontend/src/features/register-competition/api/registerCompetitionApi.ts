import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { competitionKeys } from "@/entities/competition";

export function useRegisterCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitionId: string | number) =>
      apiClient.post(`/api/competitions/${competitionId}/register`),
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({
        queryKey: competitionKeys.detail(competitionId),
      });
      queryClient.invalidateQueries({
        queryKey: competitionKeys.myRegistrations(),
      });
      queryClient.invalidateQueries({
        queryKey: competitionKeys.all,
      });
    },
  });
}

export function useUnregisterCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitionId: string | number) =>
      apiClient.delete(`/api/competitions/${competitionId}/register`),
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({
        queryKey: competitionKeys.detail(competitionId),
      });
      queryClient.invalidateQueries({
        queryKey: competitionKeys.myRegistrations(),
      });
      queryClient.invalidateQueries({
        queryKey: competitionKeys.all,
      });
    },
  });
}
