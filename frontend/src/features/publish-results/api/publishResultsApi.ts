import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { competitionKeys } from "@/entities/competition";
import type { CompetitionDetail, CompetitionResult } from "@/shared/api";

export function usePublishResultsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      results,
    }: {
      competitionId: string | number;
      results: CompetitionResult[];
    }) =>
      apiClient.put<CompetitionDetail>(
        `/api/competitions/${competitionId}/results`,
        { results }
      ),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({
        queryKey: competitionKeys.detail(competitionId),
      });
      queryClient.invalidateQueries({
        queryKey: competitionKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
