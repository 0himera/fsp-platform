import * as React from "react";
import type { Registration } from "@/shared/api";
import styles from "./TeamMembersList.module.css";

interface TeamMembersListProps {
  members: Registration[];
  captainId?: number;
  isCaptain: boolean;
  isPending: boolean;
  onRemove: (athleteId: number) => void;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  captainId,
  isCaptain,
  isPending,
  onRemove,
}) => (
  <ul className={styles.list}>
    {members.map((m) => (
      <li key={m.athlete_id} className={styles.item}>
        <span>{m.full_name}{m.athlete_id === captainId && <b>Капитан</b>}</span>
        {m.athlete_id !== captainId && isCaptain && (
          <button className={styles.remove} disabled={isPending} onClick={() => onRemove(m.athlete_id)}>
            Удалить
          </button>
        )}
      </li>
    ))}
  </ul>
);
