import * as React from "react";
import Link from "next/link";
import { Badge } from "@/shared/ui";
import { SPORT_RANKS_MAP } from "@/shared/config";
import type { Athlete } from "@/shared/api";
import styles from "./RankingTableRow.module.css";

interface RankingTableRowProps {
  athlete: Athlete;
}

export const RankingTableRow: React.FC<RankingTableRowProps> = ({ athlete }) => {
  const rankLabel = SPORT_RANKS_MAP[athlete.rank_code] || athlete.rank_code;

  return (
    <tr className={styles.row}>
      <td className={styles.cell}>{athlete.rating_place}</td>
      <td className={styles.cell}>
        <Link href={`/athletes/${athlete.id}`} className={styles.athleteLink}>
          {athlete.full_name}
        </Link>
      </td>
      <td className={styles.cell}>
        {athlete.city} · {athlete.organization}
      </td>
      <td className={styles.cell}>
        <Badge variant="outline">{rankLabel}</Badge>
      </td>
      <td className={`${styles.cell} ${styles.numberCol}`}>{athlete.result_points}</td>
      <td className={`${styles.cell} ${styles.numberCol}`}>{athlete.rank_points}</td>
      <td className={`${styles.cell} ${styles.numberCol} ${styles.totalPoints}`}>
        {athlete.rating}
      </td>
    </tr>
  );
};
