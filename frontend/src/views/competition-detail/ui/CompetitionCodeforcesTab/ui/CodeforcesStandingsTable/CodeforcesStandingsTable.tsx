"use client";

import type { CodeforcesRow } from "@/entities/codeforces";
import styles from "./CodeforcesStandingsTable.module.css";

interface Props {
  rows: CodeforcesRow[];
}

export function CodeforcesStandingsTable({ rows }: Props) {
  if (!rows.length) return null;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>#</th>
            <th className={styles.th}>Участник</th>
            <th className={styles.th}>Очки</th>
            <th className={styles.th}>Штраф</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((r, i) => {
            const handle = r.party.members[0]?.handle || "Unknown";
            const profileUrl = `https://codeforces.com/profile/${handle}`;
            return (
              <tr key={i}>
                <td className={`${styles.td} ${styles.rank}`}>{r.rank}</td>
                <td className={styles.td}>
                  <a href={profileUrl} target="_blank" rel="noreferrer" className={styles.handle}>
                    {handle}
                  </a>
                </td>
                <td className={`${styles.td} ${styles.points}`}>{r.points}</td>
                <td className={`${styles.td} ${styles.penalty}`}>{r.penalty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
