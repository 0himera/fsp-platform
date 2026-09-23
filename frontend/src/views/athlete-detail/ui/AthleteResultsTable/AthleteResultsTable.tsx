import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/shared/ui";
import { COMPETITION_LEVELS } from "@/shared/config";
import type { AthleteResult } from "@/shared/api";
import styles from "./AthleteResultsTable.module.css";

interface AthleteResultsTableProps {
  results: AthleteResult[];
}

export const AthleteResultsTable: React.FC<AthleteResultsTableProps> = ({ results }) => (
  <Card className={styles.card}>
    <CardHeader>
      <CardTitle>История выступлений и баллы arena-2</CardTitle>
    </CardHeader>
    <CardContent className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Турнир</th>
            <th className={styles.th}>Уровень</th>
            <th className={styles.th}>Место</th>
            <th className={styles.th}>Результат</th>
            <th className={`${styles.th} ${styles.numberCol}`}>Баллы</th>
            <th className={styles.th}>В рейтинге</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={styles.row}>
              <td className={styles.cell}>
                <Link href={`/competitions/${r.competition_id}`} className={styles.compLink}>
                  {r.competition}
                </Link>
              </td>
              <td className={styles.cell}>{COMPETITION_LEVELS[r.level] || r.level}</td>
              <td className={styles.cell}>№ {r.place} / {r.finishers}</td>
              <td className={styles.cell}>{r.score_text || "—"}</td>
              <td className={`${styles.cell} ${styles.numberCol} ${styles.points}`}>{r.points}</td>
              <td className={styles.cell}>
                <Badge variant={r.included ? "default" : "secondary"}>
                  {r.included ? "Топ-4" : "Запасной"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);
