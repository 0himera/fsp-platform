import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Competition, CompetitionDetail } from "@/shared/api";

export const competitionKeys = {
  all: ["competitions"] as const,
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    [...competitionKeys.all, "list", params] as const,
  detail: (id: string | number) => [...competitionKeys.all, "detail", String(id)] as const,
  myRegistrations: () => [...competitionKeys.all, "my-registrations"] as const,
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

export async function getCompetitionDetail(id: string | number): Promise<CompetitionDetail> {
  return apiClient.get<CompetitionDetail>(`/api/competitions/${id}`);
}

export function useCompetitionDetailQuery(id: string | number) {
  return useQuery({
    queryKey: competitionKeys.detail(id),
    queryFn: () => getCompetitionDetail(id),
    enabled: Boolean(id),
  });
}

export function useRegisterCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitionId: string | number) =>
      apiClient.post(`/api/competitions/${competitionId}/register`),
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.myRegistrations() });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
    },
  });
}

export function useUnregisterCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitionId: string | number) =>
      apiClient.delete(`/api/competitions/${competitionId}/register`),
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.myRegistrations() });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
    },
  });
}

export function useMyRegistrationsQuery() {
  return useQuery({
    queryKey: competitionKeys.myRegistrations(),
    queryFn: () => apiClient.get<Competition[]>("/api/me/registrations"),
    staleTime: 1000 * 60,
  });
}

export function useCreateCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: import("@/shared/api").CreateCompetitionInput) =>
      apiClient.post<Competition>("/api/competitions", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
    },
  });
}

export function useUpdateCompetitionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string | number; input: Partial<import("@/shared/api").CreateCompetitionInput> }) =>
      apiClient.put<Competition>(`/api/competitions/${id}`, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
    },
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      name,
      memberIds,
    }: {
      competitionId: string | number;
      name: string;
      memberIds: number[];
    }) =>
      apiClient.post<import("@/shared/api").Team>(`/api/competitions/${competitionId}/teams`, {
        name,
        member_ids: memberIds,
      }),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
    },
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ competitionId, teamId }: { competitionId: string | number; teamId: number }) =>
      apiClient.delete(`/api/competitions/${competitionId}/teams/${teamId}`),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
    },
  });
}

export function usePublishResultsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      competitionId,
      results,
    }: {
      competitionId: string | number;
      results: import("@/shared/api").CompetitionResult[];
    }) =>
      apiClient.put<CompetitionDetail>(`/api/competitions/${competitionId}/results`, {
        results,
      }),
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
