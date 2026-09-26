"use client";

import type { ContestLeader, ContestTaskResult } from "@/shared/api";
import styles from "../../ContestLeaderboardModal.module.css";

function TaskCell({ t }: { t: ContestTaskResult }) {
  if (t.score > 0) {
    return <span className={styles.taskSuccess}>+{t.score}<span className={styles.attempts}>({t.attempts})</span></span>;
  }
  if (t.attempts > 0) {
    return <span className={styles.taskFailed}>0<span className={styles.attempts}>({t.attempts})</span></span>;
  }
  return <span className={styles.taskEmpty}>—</span>;
}

export function LeaderboardTable({ leaders }: { leaders: ContestLeader[] }) {
  const tasks = leaders[0]?.tasks ?? [];

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>#</th>
          <th className={styles.th}>Спортсмен</th>
          {tasks.map((t, i) => <th key={t.task_id} className={`${styles.th} ${styles.alignCenter}`}>З{i + 1}</th>)}
          <th className={`${styles.th} ${styles.alignCenter}`}>Попытки</th>
          <th className={`${styles.th} ${styles.alignRight}`}>Всего PTS</th>
        </tr>
      </thead>
      <tbody>
        {leaders.map((l) => (
          <tr key={l.athlete_id}>
            <td className={`${styles.td} ${styles.placeBadge}`}>{l.place}</td>
            <td className={styles.td}>{l.full_name}</td>
            {(l.tasks ?? []).map((t) => (
              <td key={t.task_id} className={`${styles.td} ${styles.alignCenter}`}><TaskCell t={t} /></td>
            ))}
            <td className={`${styles.td} ${styles.alignCenter}`}>{l.total_attempts}</td>
            <td className={`${styles.td} ${styles.score} ${styles.alignRight}`}>{l.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
