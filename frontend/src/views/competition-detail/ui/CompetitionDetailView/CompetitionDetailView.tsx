"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/shared/ui";
import { TeamRegistrationDialog } from "@/features/manage-teams";
import { CompetitionDetailHeader } from "../CompetitionDetailHeader";
import { CompetitionDetailTabs } from "../CompetitionDetailTabs";
import { CompetitionTabContent } from "../CompetitionTabContent";
import { ContestPanel } from "../ContestPanel";
import { useCompetitionDetailView } from "../../model/useCompetitionDetailView";
import styles from "./CompetitionDetailView.module.css";

export const CompetitionDetailView: React.FC = () => {
  const id = useParams()?.id as string;
  const vm = useCompetitionDetailView(id);

  if (vm.isLoading) return <div className={styles.loading}>Загрузка турнира...</div>;
  if (vm.error || !vm.data) {
    return <div className={styles.notFound}><Card><CardHeader><CardTitle>Турнир не найден</CardTitle></CardHeader></Card></div>;
  }

  const { competition, registrations, teams, results, registered } = vm.data;

  return (
    <div className={styles.container}>
      <CompetitionDetailHeader
        competition={competition}
        registrationOpen={vm.registrationOpen}
        isRegistered={registered}
        canRegister={vm.canRegister}
        userTeam={vm.userTeam}
        onRegister={vm.actions.onRegister} onUnregister={vm.actions.onUnregister}
        onOpenCreateTeam={vm.openCreateTeam}
        onGoToTeams={() => vm.setTab("teams")}
        isPending={vm.actions.isPending}
      />
      <CompetitionDetailTabs
        currentTab={vm.tab}
        onTabChange={vm.setTab}
        regCount={vm.participants.length}
        teamsCount={teams.length}
        resultsCount={results.length}
        isOrganizer={vm.isOrganizer}
      />
      <CompetitionTabContent
        tab={vm.tab}
        competition={competition}
        registrations={registrations}
        participants={vm.participants}
        teams={teams}
        results={results}
        isOrganizer={vm.isOrganizer}
        canRegister={vm.canRegister}
        userTeam={vm.userTeam}
        currentUserId={vm.currentUserId}
        onOpenCreateTeam={vm.openCreateTeam}
      />
      <ContestPanel competition={competition} isOrganizer={vm.isOrganizer} isRegistered={registered} />
      {vm.isCreateTeamOpen && <TeamRegistrationDialog competition={competition} onClose={vm.closeCreateTeam} />}
    </div>
  );
};
