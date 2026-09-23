import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge } from "@/shared/ui";
import { COMPETITION_LEVELS, COMPETITION_STATUSES } from "@/shared/config";
import type { Competition } from "@/shared/api";
import styles from "./CompetitionItem.module.css";

interface CompetitionItemProps {
  competition: Competition;
  isRegistered: boolean;
  canRegister: boolean;
  onRegister: (id: number) => void;
  isRegistering: boolean;
}

export const CompetitionItem: React.FC<CompetitionItemProps> = ({
  competition,
  isRegistered,
  canRegister,
  onRegister,
  isRegistering,
}) => {
  const statusLabel = COMPETITION_STATUSES[competition.status] || competition.status;
  const levelLabel = COMPETITION_LEVELS[competition.level_code] || competition.level_code;
  const dateStr = new Date(competition.starts_at).toLocaleDateString("ru-RU");

  return (
    <Card className={styles.card}>
      <CardHeader>
        <div className={styles.badges}>
          <Badge variant={competition.status === "open" ? "default" : "secondary"}>{statusLabel}</Badge>
          <span className={styles.level}>{levelLabel}</span>
        </div>
        <CardTitle>
          <Link href={`/competitions/${competition.id}`} className={styles.titleLink}>
            {competition.title}
          </Link>
        </CardTitle>
        <CardDescription className={styles.meta}>
          {dateStr} · {competition.location}
        </CardDescription>
      </CardHeader>
      <div className={styles.footer}>
        <span className={styles.count}>Участников: {competition.registrations_count}</span>
        {isRegistered && <Badge variant="outline">Вы зарегистрированы</Badge>}
        {!isRegistered && canRegister && (
          <Button size="sm" className={styles.actionBtn} onClick={() => onRegister(competition.id)} disabled={isRegistering}>
            Подать заявку
          </Button>
        )}
      </div>
    </Card>
  );
};
