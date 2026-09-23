import * as React from "react";
import { useCompetitionDetailQuery } from "@/entities/competition";
import { useMeQuery } from "@/entities/user";
import { useCompetitionDetailActions } from "./useCompetitionDetailActions";
import type { DetailTab } from "../ui/CompetitionDetailTabs";

export function useCompetitionDetailView(id: string) {
  const { data, isLoading, error } = useCompetitionDetailQuery(id);
  const { data: me } = useMeQuery();
  const [tab, setTab] = React.useState<DetailTab>("registrations");
  const actions = useCompetitionDetailActions(Number(id));

  const isOrganizer = me?.user?.role === "organizer";
  const canRegister = Boolean(
    me?.user?.role === "athlete" &&
    data?.competition.registration_open &&
    !data?.registered
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
  };
}
