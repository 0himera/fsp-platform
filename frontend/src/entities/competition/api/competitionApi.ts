import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Competition, CompetitionDetail } from "@/shared/api";

export const competitionKeys = {
  all: ["competitions"] as const,
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    [...competitionKeys.all, "list", params] as const,
  detail: (id: string | number) =>
    [...competitionKeys.all, "detail", String(id)] as const,
  myRegistrations: () =>
    [...competitionKeys.all, "my-registrations"] as const,
};

export async function getCompetitions(params?: {
  status?: string;
  phase?: string;
  q?: string;
}): Promise<Competition[]> {
  return apiClient.get<Competition[]>("/api/competitions", { params });
}

export function useCompetitionsQuery(params?: {
  status?: string;
  phase?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: competitionKeys.list(params),
    queryFn: () => getCompetitions(params),
    staleTime: 1000 * 30,
  });
}

export async function getCompetitionDetail(
  id: string | number
): Promise<CompetitionDetail> {
  return apiClient.get<CompetitionDetail>(`/api/competitions/${id}`);
}

export function useCompetitionDetailQuery(id: string | number) {
  return useQuery({
    queryKey: competitionKeys.detail(id),
    queryFn: () => getCompetitionDetail(id),
    enabled: Boolean(id),
  });
}

export function useMyRegistrationsQuery() {
  return useQuery({
    queryKey: competitionKeys.myRegistrations(),
    queryFn: () => apiClient.get<Competition[]>("/api/me/registrations"),
    staleTime: 1000 * 60,
  });
}
