import * as React from "react";
import type { Competition, Registration, Team } from "@/shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { CompetitionEditForm } from "@/features/manage-competition";
import { PublicationHistory } from "@/features/manage-publications";
import { CompetitionDocuments } from "@/features/manage-documents";
import { PublishProtocolCard } from "../PublishProtocolCard";
import { CompetitionJudges } from "../CompetitionJudges";
import { CompetitionLifecycleControls } from "../CompetitionLifecycleControls";

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
    <Card className="mb-6">
      <CardHeader><CardTitle>Настройки турнира</CardTitle></CardHeader>
      <CardContent><CompetitionEditForm key={`${competition.id}-${competition.starts_at}-${competition.ends_at}`} competition={competition} /></CardContent>
    </Card>
    <CompetitionLifecycleControls competition={competition} />
    <PublishProtocolCard competition={competition} registrations={registrations} teams={teams} />
    <PublicationHistory competitionId={competition.id} editable={true} />
    <CompetitionDocuments id={competition.id} editable={true} />
    <CompetitionJudges competitionId={competition.id} />
  </div>
);
