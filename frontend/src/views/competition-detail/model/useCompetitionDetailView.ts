import * as React from "react";
import { useCompetitionDetailQuery } from "@/entities/competition";
import { useMeQuery } from "@/entities/user";
import { useCompetitionDetailActions } from "./useCompetitionDetailActions";
import type { DetailTab } from "../ui/CompetitionDetailTabs";

export function useCompetitionDetailView(id: string) {
  const { data, isLoading, error } = useCompetitionDetailQuery(id);
  const { data: me } = useMeQuery();
  const [tab, setTab] = React.useState<DetailTab>("registrations");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = React.useState(false);
  const actions = useCompetitionDetailActions(Number(id));

  const isOrganizer = me?.user?.role === "organizer";
  const userId = me?.user?.id;
  const canRegister = Boolean(
    me?.user?.role === "athlete" &&
    data?.competition.registration_open &&
    !data?.registered
  );

  const userTeam = data?.teams.find(
    (t) => t.captain_id === userId || t.members.some((m) => m.athlete_id === userId)
  );

  return {
    data,
    isLoading,
    error,
    tab,
    setTab,
    actions,
    isOrganizer: Boolean(isOrganizer),
    canRegister,
    currentUserId: userId,
    userTeam,
    isCreateTeamOpen,
    openCreateTeam: () => setIsCreateTeamOpen(true),
    closeCreateTeam: () => setIsCreateTeamOpen(false),
  };
}
