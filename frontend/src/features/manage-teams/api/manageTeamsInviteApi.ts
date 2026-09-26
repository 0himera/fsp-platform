import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type Team } from "@/shared/api";
import { competitionKeys } from "@/entities/competition";

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
    mutationFn: (token: string) => apiClient.post<{ team: Team; joined: boolean }>(`/api/team-invitations/${token}/accept`),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: competitionKeys.all });
      client.invalidateQueries({ queryKey: competitionKeys.detail(data.team.competition_id || 0) });
      client.invalidateQueries({ queryKey: competitionKeys.myRegistrations() });
    },
  });
}
