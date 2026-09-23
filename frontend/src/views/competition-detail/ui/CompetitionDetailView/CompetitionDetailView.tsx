"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";
import { useCompetitionDetailQuery } from "@/entities/competition";
import { useMeQuery } from "@/entities/user";
import { CompetitionDetailHeader } from "../CompetitionDetailHeader";
import { CompetitionDetailTabs, type DetailTab } from "../CompetitionDetailTabs";
import { CompetitionTabContent } from "../CompetitionTabContent";
import { useCompetitionDetailActions } from "../../model/useCompetitionDetailActions";
import styles from "./CompetitionDetailView.module.css";

export const CompetitionDetailView: React.FC = () => {
  const id = useParams()?.id as string;
  const { data, isLoading, error } = useCompetitionDetailQuery(id);
  const { data: me } = useMeQuery();
  const [tab, setTab] = React.useState<DetailTab>("registrations");
  const actions = useCompetitionDetailActions(Number(id));

  const isOrganizer = me?.user?.role === "organizer";
  const isAthlete = me?.user?.role === "athlete";

  if (isLoading) return <div className={styles.loading}>Загрузка турнира...</div>;
  if (error || !data) {
    return (
      <div className={styles.notFound}>
        <Card><CardHeader><CardTitle>Турнир не найден</CardTitle><CardDescription>Проверьте номер</CardDescription></CardHeader></Card>
      </div>
    );
  }

  const { competition, registrations, teams, results, registered } = data;
  const canReg = Boolean(isAthlete && competition.registration_open && !registered);

  return (
    <div className={styles.container}>
      <CompetitionDetailHeader
        competition={competition}
        isRegistered={registered}
        canRegister={canReg}
        onRegister={actions.onRegister}
        onUnregister={actions.onUnregister}
        isPending={actions.isPending}
      />
      <CompetitionDetailTabs
        currentTab={tab}
        onTabChange={setTab}
        regCount={registrations.length}
        teamsCount={teams.length}
        resultsCount={results.length}
        isOrganizer={Boolean(isOrganizer)}
      />
      <CompetitionTabContent
        tab={tab}
        competitionId={competition.id}
        registrations={registrations}
        teams={teams}
        results={results}
        isOrganizer={Boolean(isOrganizer)}
        onDeleteTeam={actions.onDeleteTeam}
        isDeletingTeam={actions.isDeletingTeam}
      />
    </div>
  );
};
