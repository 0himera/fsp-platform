import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { disciplineKeys } from "@/entities/discipline";
import type { Discipline } from "@/shared/api";

export function useCreateDisciplineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { code: string; name: string }) =>
      apiClient.post<Discipline>("/api/disciplines", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.all });
    },
  });
}

export function useRenameDisciplineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, name }: { code: string; name: string }) =>
      apiClient.put<Discipline>(`/api/disciplines/${code}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.all });
    },
  });
}
