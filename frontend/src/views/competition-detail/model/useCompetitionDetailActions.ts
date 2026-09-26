import { useRegisterCompetitionMutation, useUnregisterCompetitionMutation } from "@/features/register-competition";
import { useDeleteTeamMutation, useRemoveTeamMemberMutation } from "@/features/manage-teams";

export function useCompetitionDetailActions(competitionId: number) {
  const registerMutation = useRegisterCompetitionMutation();
  const unregisterMutation = useUnregisterCompetitionMutation();
  const deleteTeamMutation = useDeleteTeamMutation();
  const removeMemberMutation = useRemoveTeamMemberMutation();

  return {
    onRegister: () => registerMutation.mutate(competitionId),
    onUnregister: () => unregisterMutation.mutate(competitionId),
    isPending: registerMutation.isPending || unregisterMutation.isPending,
    onDeleteTeam: (teamId: number) =>
      deleteTeamMutation.mutate({ competitionId, teamId }),
    isDeletingTeam: deleteTeamMutation.isPending,
    onRemoveMember: (teamId: number, athleteId: number) =>
      removeMemberMutation.mutate({ competitionId, teamId, athleteId }),
    isRemovingMember: removeMemberMutation.isPending,
  };
}
