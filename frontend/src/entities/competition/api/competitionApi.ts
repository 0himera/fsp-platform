import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Competition, CompetitionDetail, CompetitionParticipant, ResultPublication } from "@/shared/api";

export const competitionKeys = {
  all: ["competitions"] as const,
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    [...competitionKeys.all, "list", params] as const,
  detail: (id: string | number) =>
    [...competitionKeys.all, "detail", String(id)] as const,
  myRegistrations: () =>
    [...competitionKeys.all, "my-registrations"] as const,
};

export function useCompetitionsQuery(params?: { status?: string; phase?: string; q?: string }) {
  return useQuery({
    queryKey: competitionKeys.list(params),
    queryFn: () => apiClient.get<Competition[]>("/api/competitions", { params }),
    staleTime: 1000 * 30,
  });
}

export function useCompetitionDetailQuery(id: string | number) {
  return useQuery({
    queryKey: competitionKeys.detail(id),
    queryFn: () => apiClient.get<CompetitionDetail>(`/api/competitions/${id}`),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const competition = query.state.data?.competition;
      return competition?.status === "open" && new Date(competition.starts_at).getTime() > Date.now() ? 5000 : false;
    },
  });
}

export function useCompetitionParticipantsQuery(id: string | number) {
  return useQuery({
    queryKey: [...competitionKeys.detail(id), "participants"],
    queryFn: () => apiClient.get<CompetitionParticipant[]>(`/api/competitions/${id}/participants`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useResultPublicationsQuery(id: string | number) {
  return useQuery({
    queryKey: [...competitionKeys.detail(id), "publications"],
    queryFn: () => apiClient.get<ResultPublication[]>(`/api/competitions/${id}/publications`),
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
