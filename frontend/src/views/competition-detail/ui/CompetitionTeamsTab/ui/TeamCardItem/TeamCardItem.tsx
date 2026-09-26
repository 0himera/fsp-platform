import * as React from "react";
import { Badge } from "@/shared/ui";
import type { Team } from "@/shared/api";
import styles from "./TeamCardItem.module.css";

interface Props {
  team: Team;
  isMyTeam: boolean;
}

export const TeamCardItem: React.FC<Props> = ({ team, isMyTeam }) => (
  <div className={styles.item}>
    <div className={styles.header}>
      <span className={styles.name}>{team.name}</span>
      {isMyTeam && <Badge variant="default">Ваша команда</Badge>}
    </div>
    <div className={styles.members}>
      {team.members.map((m) => (
        <Badge key={m.athlete_id} variant={m.athlete_id === team.captain_id ? "default" : "secondary"}>
          {m.full_name} {m.athlete_id === team.captain_id ? "★" : ""}
        </Badge>
      ))}
    </div>
  </div>
);
