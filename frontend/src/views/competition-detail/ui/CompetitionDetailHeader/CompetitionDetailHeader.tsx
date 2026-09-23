import * as React from "react";
import { Card, CardHeader, CardContent, Button, Badge } from "@/shared/ui";
import { COMPETITION_LEVELS, COMPETITION_STATUSES, COMPETITION_STAGES } from "@/shared/config";
import type { Competition } from "@/shared/api";
import styles from "./CompetitionDetailHeader.module.css";

interface CompetitionDetailHeaderProps {
  competition: Competition;
  isRegistered?: boolean;
  canRegister: boolean;
  onRegister: () => void;
  onUnregister: () => void;
  isPending: boolean;
}

export const CompetitionDetailHeader: React.FC<CompetitionDetailHeaderProps> = ({
  competition,
  isRegistered,
  canRegister,
  onRegister,
  onUnregister,
  isPending,
}) => {
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
            </div>
            <h1 className={styles.title}>{competition.title}</h1>
          </div>
          {isRegistered ? (
            <Button variant="outline" onClick={onUnregister} disabled={isPending}>
              Отозвать заявку
            </Button>
          ) : canRegister ? (
            <Button onClick={onRegister} disabled={isPending}>
              Подать заявку
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className={styles.metaGrid}>
          <div>Место: <strong>{competition.location}</strong></div>
          <div>Даты: <strong>{new Date(competition.starts_at).toLocaleDateString("ru-RU")} — {new Date(competition.ends_at).toLocaleDateString("ru-RU")}</strong></div>
          <div>Дедлайн: <strong>{new Date(competition.registration_deadline).toLocaleDateString("ru-RU")}</strong></div>
        </div>
      </CardContent>
    </Card>
  );
};
