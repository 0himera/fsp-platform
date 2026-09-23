import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/shared/ui";
import type { Team } from "@/shared/api";
import styles from "./CompetitionTeamsTab.module.css";

interface CompetitionTeamsTabProps {
  teams: Team[];
  isOrganizer: boolean;
  onDeleteTeam: (teamId: number) => void;
  isDeleting: boolean;
}

export const CompetitionTeamsTab: React.FC<CompetitionTeamsTabProps> = ({
  teams,
  isOrganizer,
  onDeleteTeam,
  isDeleting,
}) => (
  <Card className={styles.card}>
    <CardHeader>
      <CardTitle>Командные составы ({teams.length})</CardTitle>
    </CardHeader>
    <CardContent>
      {teams.length === 0 ? (
        <p className={styles.empty}>Команды пока не сформированы</p>
      ) : (
        <div className={styles.teamsList}>
          {teams.map((t) => (
            <div key={t.id} className={styles.teamItem}>
              <div className={styles.teamHeader}>
                <span className={styles.teamName}>{t.name}</span>
                {isOrganizer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteTeam(t.id)}
                    disabled={isDeleting}
                  >
                    Удалить
                  </Button>
                )}
              </div>
              <div className={styles.members}>
                {t.members.map((m) => (
                  <Badge key={m.athlete_id} variant="secondary">
                    {m.full_name} ({m.city || m.organization || "Дагестан"})
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
