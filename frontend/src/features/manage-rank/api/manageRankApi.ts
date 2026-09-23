import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { Athlete } from "@/shared/api";

export function useUpdateRankMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      athleteId,
      rankCode,
    }: {
      athleteId: string | number;
      rankCode: string;
    }) =>
      apiClient.patch<Athlete>(`/api/athletes/${athleteId}/rank`, {
        rank_code: rankCode,
      }),
    onSuccess: (data, { athleteId }) => {
      queryClient.setQueryData(userKeys.profile(athleteId), data);
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
