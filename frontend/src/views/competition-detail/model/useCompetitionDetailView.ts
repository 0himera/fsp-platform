import * as React from "react";
import { useCompetitionDetailQuery, useCompetitionParticipantsQuery } from "@/entities/competition";
import { useMeQuery } from "@/entities/user";
import { useCompetitionDetailActions } from "./useCompetitionDetailActions";
import type { DetailTab } from "../ui/CompetitionDetailTabs";
import { useRegistrationWindow } from "./useRegistrationWindow";

export function useCompetitionDetailView(id: string) {
  const { data, isLoading, error } = useCompetitionDetailQuery(id);
  const { data: participants } = useCompetitionParticipantsQuery(id);
  const { data: me } = useMeQuery();
  const [tab, setTab] = React.useState<DetailTab>("registrations");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = React.useState(false);
  const actions = useCompetitionDetailActions(Number(id));
  const registrationOpen = useRegistrationWindow(data?.competition);

  const isOrganizer = me?.user?.role === "organizer";
  const userId = me?.user?.id;
  const canRegister = Boolean(
    me?.user?.role === "athlete" &&
    registrationOpen &&
    !data?.registered
  );

  const userTeam = data?.teams.find(
    (t) => t.captain_id === userId || t.members.some((m) => m.athlete_id === userId)
  );

  return {
    data,
    participants: participants ?? [],
    isLoading,
    error,
    tab,
    setTab,
    actions,
    isOrganizer: Boolean(isOrganizer),
    canRegister,
    registrationOpen,
    currentUserId: userId,
    userTeam,
    isCreateTeamOpen,
    openCreateTeam: () => setIsCreateTeamOpen(true),
    closeCreateTeam: () => setIsCreateTeamOpen(false),
  };
}
