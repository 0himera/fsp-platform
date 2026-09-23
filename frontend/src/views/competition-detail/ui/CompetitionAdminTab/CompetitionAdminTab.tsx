import * as React from "react";
import type { Registration } from "@/shared/api";
import { CreateTeamCard } from "../CreateTeamCard";
import { PublishProtocolCard } from "../PublishProtocolCard";

interface CompetitionAdminTabProps {
  competitionId: number;
  registrations: Registration[];
}

export const CompetitionAdminTab: React.FC<CompetitionAdminTabProps> = ({
  competitionId,
  registrations,
}) => (
  <div>
    <CreateTeamCard competitionId={competitionId} registrations={registrations} />
    <PublishProtocolCard competitionId={competitionId} registrations={registrations} />
  </div>
);
