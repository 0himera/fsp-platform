import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/shared/ui";
import { TeamManager } from "@/features/manage-teams";
import type { Team } from "@/shared/api";
import { TeamCardItem } from "./ui/TeamCardItem";
import styles from "./CompetitionTeamsTab.module.css";

interface CompetitionTeamsTabProps {
  competitionId: number;
  teams: Team[];
  userTeam?: Team;
  maxTeamSize?: number;
  currentUserId?: number;
  canRegister: boolean;
  onOpenCreateTeam: () => void;
}

export const CompetitionTeamsTab: React.FC<CompetitionTeamsTabProps> = ({
  competitionId,
  teams,
  userTeam,
  maxTeamSize = 5,
  currentUserId = 0,
  canRegister,
  onOpenCreateTeam,
}) => (
  <div>
    {userTeam && (
      <div className={styles.myTeamWrapper}>
        <TeamManager competitionId={competitionId} team={userTeam} maxSize={maxTeamSize} athleteId={currentUserId} />
      </div>
    )}
    <Card className={styles.card}>
      <CardHeader>
        <div className={styles.topAction}>
          <CardTitle>Все команды ({teams.length})</CardTitle>
          {canRegister && !userTeam && (
            <Button size="sm" onClick={onOpenCreateTeam}>Создать команду</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className={styles.empty}>Команды пока не сформированы</p>
        ) : (
          <div className={styles.teamsList}>
            {teams.map((t) => (
              <TeamCardItem key={t.id} team={t} isMyTeam={t.id === userTeam?.id} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
