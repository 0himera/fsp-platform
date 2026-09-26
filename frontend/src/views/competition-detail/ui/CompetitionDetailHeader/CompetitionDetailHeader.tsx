import * as React from "react";
import { Card, CardHeader, CardContent, Badge } from "@/shared/ui";
import { COMPETITION_LEVELS, COMPETITION_STATUSES, COMPETITION_STAGES } from "@/shared/config";
import type { Competition, Team } from "@/shared/api";
import { HeaderActionButtons } from "./ui/HeaderActionButtons";
import styles from "./CompetitionDetailHeader.module.css";

interface CompetitionDetailHeaderProps {
  competition: Competition;
  registrationOpen: boolean;
  isRegistered?: boolean;
  canRegister: boolean;
  userTeam?: Team;
  onRegister: () => void;
  onUnregister: () => void;
  onOpenCreateTeam: () => void;
  onGoToTeams: () => void;
  isPending: boolean;
}

export const CompetitionDetailHeader: React.FC<CompetitionDetailHeaderProps> = (props) => {
  const { competition } = props;
  const isTeam = competition.format === "team";
  const status = COMPETITION_STATUSES[competition.status] || competition.status;
  const level = COMPETITION_LEVELS[competition.level_code] || competition.level_code;
  const stage = COMPETITION_STAGES[competition.stage] || competition.stage;

  return (
    <Card className={styles.headerCard}>
      <CardHeader>
        <div className={styles.topRow}>
          <div>
            <div className={styles.badges}>
              <Badge variant={competition.status === "open" ? "default" : "secondary"}>{status}</Badge>
              <Badge variant="outline">{level}</Badge>
              <Badge variant="outline">{stage}</Badge>
              <Badge variant="outline">{isTeam ? "Командный" : "Индивидуальный"}</Badge>
            </div>
            <h1 className={styles.title}>{competition.title}</h1>
          </div>
          <HeaderActionButtons {...props} isTeam={isTeam} canUnregister={props.registrationOpen} userTeamName={props.userTeam?.name} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={styles.metaGrid}>
          <div>Место: <strong>{competition.location}</strong></div>
          <div>Даты: <strong>{formatDateTime(competition.starts_at)} — {formatDateTime(competition.ends_at)}</strong></div>
          <div>Дедлайн регистрации: <strong>{formatDateTime(competition.registration_deadline)}</strong></div>
        </div>
      </CardContent>
    </Card>
  );
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
