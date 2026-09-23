import * as React from "react";
import type { DetailTab } from "../CompetitionDetailTabs";
import type { Registration, Team, CompetitionResult } from "@/shared/api";
import { CompetitionRegistrationsTab } from "../CompetitionRegistrationsTab";
import { CompetitionTeamsTab } from "../CompetitionTeamsTab";
import { CompetitionResultsTab } from "../CompetitionResultsTab";
import { CompetitionAdminTab } from "../CompetitionAdminTab";

interface CompetitionTabContentProps {
  tab: DetailTab;
  competitionId: number;
  registrations: Registration[];
  teams: Team[];
  results: CompetitionResult[];
  isOrganizer: boolean;
  onDeleteTeam: (teamId: number) => void;
  isDeletingTeam: boolean;
}

export const CompetitionTabContent: React.FC<CompetitionTabContentProps> = ({
  tab,
  competitionId,
  registrations,
  teams,
  results,
  isOrganizer,
  onDeleteTeam,
  isDeletingTeam,
}) => {
  if (tab === "registrations") {
    return <CompetitionRegistrationsTab registrations={registrations} />;
  }
  if (tab === "teams") {
    return (
      <CompetitionTeamsTab
        teams={teams}
        isOrganizer={isOrganizer}
        onDeleteTeam={onDeleteTeam}
        isDeleting={isDeletingTeam}
      />
    );
  }
  if (tab === "results") {
    return <CompetitionResultsTab results={results} />;
  }
  if (tab === "admin" && isOrganizer) {
    return (
      <CompetitionAdminTab
        competitionId={competitionId}
        registrations={registrations}
      />
    );
  }
  return null;
};
