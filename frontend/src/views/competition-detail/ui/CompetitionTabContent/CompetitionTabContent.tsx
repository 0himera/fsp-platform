import * as React from "react";
import type { DetailTab } from "../CompetitionDetailTabs";
import type { Competition, Registration, CompetitionParticipant, Team, CompetitionResult } from "@/shared/api";
import { CompetitionRegistrationsTab } from "../CompetitionRegistrationsTab";
import { CompetitionTeamsTab } from "../CompetitionTeamsTab";
import { CompetitionResultsTab } from "../CompetitionResultsTab";
import { CompetitionAdminTab } from "../CompetitionAdminTab";
import { CompetitionCodeforcesTab } from "../CompetitionCodeforcesTab";

interface CompetitionTabContentProps {
  tab: DetailTab;
  competition: Competition;
  registrations: Registration[];
  participants: CompetitionParticipant[];
  teams: Team[];
  results: CompetitionResult[];
  isOrganizer: boolean;
  canRegister: boolean;
  userTeam?: Team;
  currentUserId?: number;
  onOpenCreateTeam: () => void;
}

export const CompetitionTabContent: React.FC<CompetitionTabContentProps> = ({
  tab, competition, registrations, participants, teams, results,
  isOrganizer, canRegister, userTeam, currentUserId, onOpenCreateTeam,
}) => {
  if (tab === "registrations") {
    return <CompetitionRegistrationsTab registrations={isOrganizer ? registrations : participants} />;
  }
  if (tab === "teams") {
    return (
      <CompetitionTeamsTab
        competitionId={competition.id}
        teams={teams}
        userTeam={userTeam}
        maxTeamSize={competition.max_team_size || 5}
        currentUserId={currentUserId}
        canRegister={canRegister}
        onOpenCreateTeam={onOpenCreateTeam}
      />
    );
  }
  if (tab === "results") return <CompetitionResultsTab results={results} />;
  if (tab === "codeforces") {
    return <CompetitionCodeforcesTab competitionId={competition.id} organizer={isOrganizer} />;
  }
  if (tab === "admin" && isOrganizer) {
    return <CompetitionAdminTab competition={competition} registrations={registrations} teams={teams} />;
  }
  return null;
};
