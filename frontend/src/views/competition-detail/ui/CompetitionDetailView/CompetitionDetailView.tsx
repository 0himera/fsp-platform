"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";
import { CompetitionDetailHeader } from "../CompetitionDetailHeader";
import { CompetitionDetailTabs } from "../CompetitionDetailTabs";
import { CompetitionTabContent } from "../CompetitionTabContent";
import { useCompetitionDetailView } from "../../model/useCompetitionDetailView";
import styles from "./CompetitionDetailView.module.css";

export const CompetitionDetailView: React.FC = () => {
  const id = useParams()?.id as string;
  const vm = useCompetitionDetailView(id);

  if (vm.isLoading) return <div className={styles.loading}>Загрузка турнира...</div>;
  if (vm.error || !vm.data) {
    return (
      <div className={styles.notFound}>
        <Card><CardHeader><CardTitle>Турнир не найден</CardTitle><CardDescription>Проверьте номер</CardDescription></CardHeader></Card>
      </div>
    );
  }

  const { competition, registrations, teams, results, registered } = vm.data;

  return (
    <div className={styles.container}>
      <CompetitionDetailHeader
        competition={competition}
        isRegistered={registered}
        canRegister={vm.canRegister}
        onRegister={vm.actions.onRegister}
        onUnregister={vm.actions.onUnregister}
        isPending={vm.actions.isPending}
      />
      <CompetitionDetailTabs
        currentTab={vm.tab}
        onTabChange={vm.setTab}
        regCount={registrations.length}
        teamsCount={teams.length}
        resultsCount={results.length}
        isOrganizer={vm.isOrganizer}
      />
      <CompetitionTabContent
        tab={vm.tab}
        competitionId={competition.id}
        registrations={registrations}
        teams={teams}
        results={results}
        isOrganizer={vm.isOrganizer}
        onDeleteTeam={vm.actions.onDeleteTeam}
        isDeletingTeam={vm.actions.isDeletingTeam}
      />
    </div>
  );
};
