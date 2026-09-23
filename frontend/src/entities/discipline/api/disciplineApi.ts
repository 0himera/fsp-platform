import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Discipline } from "@/shared/api";

export const disciplineKeys = {
  all: ["disciplines"] as const,
};

export async function getDisciplines(): Promise<Discipline[]> {
  return apiClient.get<Discipline[]>("/api/disciplines");
}

export function useDisciplinesQuery() {
  return useQuery({
    queryKey: disciplineKeys.all,
    queryFn: getDisciplines,
    staleTime: 1000 * 60 * 10,
  });
}

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
