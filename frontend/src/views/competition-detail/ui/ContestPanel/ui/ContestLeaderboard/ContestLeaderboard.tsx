"use client";

import type { ContestLeader, ContestTaskResult } from "@/shared/api";
import styles from "./ContestLeaderboard.module.css";

interface Props {
  leaders?: ContestLeader[];
}

function TaskCell({ t }: { t: ContestTaskResult }) {
  if (t.score > 0) {
    return <span className={styles.taskSuccess}>+{t.score}<span className={styles.attempts}>({t.attempts})</span></span>;
  }
  if (t.attempts > 0) {
    return <span className={styles.taskFailed}>0<span className={styles.attempts}>({t.attempts})</span></span>;
  }
  return <span className={styles.taskEmpty}>—</span>;
}

export function ContestLeaderboard({ leaders }: Props) {
  if (!leaders || !leaders.length) return null;
  const tasks = leaders[0]?.tasks ?? [];

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Итоговая таблица</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>#</th>
            <th className={styles.th}>Участник</th>
            {tasks.map((t, i) => <th key={t.task_id} className={`${styles.th} ${styles.alignCenter}`}>З{i + 1}</th>)}
            <th className={`${styles.th} ${styles.alignCenter}`}>Попытки</th>
            <th className={`${styles.th} ${styles.alignRight}`}>Всего PTS</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((row) => (
            <tr key={row.athlete_id}>
              <td className={styles.td}>{row.place}</td>
              <td className={styles.td}>{row.full_name}</td>
              {(row.tasks ?? []).map((t) => (
                <td key={t.task_id} className={`${styles.td} ${styles.alignCenter}`}><TaskCell t={t} /></td>
              ))}
              <td className={`${styles.td} ${styles.alignCenter}`}>{row.total_attempts}</td>
              <td className={`${styles.td} ${styles.alignRight}`}>{row.score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
