import { useQuery } from "@tanstack/react-query";
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
