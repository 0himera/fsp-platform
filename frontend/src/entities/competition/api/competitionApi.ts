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

export function useCompetitionParticipantsQuery(id: string | number) {
  return useQuery({
    queryKey: [...competitionKeys.detail(id), "participants"],
    queryFn: () => apiClient.get<import("@/shared/api").CompetitionParticipant[]>(`/api/competitions/${id}/participants`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useResultPublicationsQuery(id: string | number) {
  return useQuery({
    queryKey: [...competitionKeys.detail(id), "publications"],
    queryFn: () => apiClient.get<import("@/shared/api").ResultPublication[]>(`/api/competitions/${id}/publications`),
    enabled: Boolean(id),
  });
}

export function useRestorePublicationMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ competitionId, publicationId }: { competitionId: number; publicationId: number }) =>
      apiClient.post(`/api/competitions/${competitionId}/publications/${publicationId}/restore`),
    onSuccess: (_, { competitionId }) => {
      client.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) });
      client.invalidateQueries({ queryKey: ["rankings"] });
      client.invalidateQueries({ queryKey: [...competitionKeys.detail(competitionId), "publications"] });
    },
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
    mutationFn: ({ competitionId, name, description }: { competitionId: number; name: string; description: string }) =>
      apiClient.post<import("@/shared/api").CreateTeamResponse>(`/api/competitions/${competitionId}/teams`, {
        name,
        description,
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

export function useUpdateTeamMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ competitionId, teamId, name, description }: { competitionId: number; teamId: number; name: string; description: string }) =>
      apiClient.patch(`/api/competitions/${competitionId}/teams/${teamId}`, { name, description }),
    onSuccess: (_, { competitionId }) => client.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) }),
  });
}

export function useCreateTeamInviteLinkMutation() {
  return useMutation({
    mutationFn: ({ competitionId, teamId }: { competitionId: number; teamId: number }) =>
      apiClient.post<{ invite_url: string }>(`/api/competitions/${competitionId}/teams/${teamId}/invite-link`),
  });
}

export function useInviteTeamMembersMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ competitionId, teamId, emails }: { competitionId: number; teamId: number; emails: string[] }) =>
      apiClient.post<{ sent: string[]; failed: string[] }>(`/api/competitions/${competitionId}/teams/${teamId}/invites`, { emails }),
    onSuccess: (_, { competitionId }) => client.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) }),
  });
}

export function useRemoveTeamMemberMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ competitionId, teamId, athleteId }: { competitionId: number; teamId: number; athleteId: number }) =>
      apiClient.delete(`/api/competitions/${competitionId}/teams/${teamId}/members/${athleteId}`),
    onSuccess: (_, { competitionId }) => client.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) }),
  });
}

export function useAcceptTeamInviteMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => apiClient.post<{ team: import("@/shared/api").Team; joined: boolean }>(`/api/team-invitations/${token}/accept`),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: competitionKeys.all });
      client.invalidateQueries({ queryKey: competitionKeys.detail(data.team.competition_id) });
      client.invalidateQueries({ queryKey: competitionKeys.myRegistrations() });
      client.invalidateQueries({ queryKey: ["users"] });
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
      queryClient.invalidateQueries({ queryKey: [...competitionKeys.detail(competitionId), "publications"] });
      queryClient.invalidateQueries({ queryKey: competitionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
