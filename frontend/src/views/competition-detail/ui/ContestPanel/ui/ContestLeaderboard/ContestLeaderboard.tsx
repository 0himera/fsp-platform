"use client";

import type { ContestLeader } from "@/shared/api";
import styles from "./ContestLeaderboard.module.css";

interface Props {
  leaders?: ContestLeader[];
}

export function ContestLeaderboard({ leaders }: Props) {
  if (!leaders || !leaders.length) return null;

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Итоговая таблица</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Место</th>
            <th className={styles.th}>Участник</th>
            <th className={styles.th}>Баллы</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((row) => (
            <tr key={row.athlete_id}>
              <td className={styles.td}>{row.place}</td>
              <td className={styles.td}>{row.full_name}</td>
              <td className={styles.td}>{row.score.toFixed(2)} / {row.max_score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
