import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { competitionKeys } from "@/entities/competition";
import type { Competition, CreateCompetitionInput } from "@/shared/api";

export function useCreateCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCompetitionInput) =>
      apiClient.post<Competition>("/api/competitions", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
    },
  });
}

export function useUpdateCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string | number;
      input: Partial<CreateCompetitionInput>;
    }) => apiClient.put<Competition>(`/api/competitions/${id}`, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
    },
  });
}
