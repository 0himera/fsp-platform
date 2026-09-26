import * as React from "react";
import type { Competition, Registration, Team } from "@/shared/api";
import { PublicationHistory } from "@/features/manage-publications";
import { CompetitionDocuments } from "@/features/manage-documents";
import { PublishProtocolCard } from "../PublishProtocolCard";
import { CompetitionJudges } from "../CompetitionJudges";

interface CompetitionAdminTabProps {
  competition: Competition;
  registrations: Registration[];
  teams: Team[];
}

export const CompetitionAdminTab: React.FC<CompetitionAdminTabProps> = ({
  competition,
  registrations,
  teams,
}) => (
  <div>
    <PublishProtocolCard competition={competition} registrations={registrations} teams={teams} />
    <PublicationHistory competitionId={competition.id} editable={true} />
    <CompetitionDocuments id={competition.id} editable={true} />
    <CompetitionJudges competitionId={competition.id} />
  </div>
);
