import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import type { CompetitionResult } from "@/shared/api";
import styles from "./CompetitionResultsTab.module.css";

interface CompetitionResultsTabProps {
  results: CompetitionResult[];
}

export const CompetitionResultsTab: React.FC<CompetitionResultsTabProps> = ({ results }) => (
  <Card className={styles.card}>
    <CardHeader>
      <CardTitle>Официальный итоговый протокол ({results.length})</CardTitle>
    </CardHeader>
    <CardContent className={styles.tableWrapper}>
      {results.length === 0 ? (
        <p className={styles.empty}>Результаты турнира ещё не опубликованы</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Место</th>
              <th className={styles.th}>Участник / Команда</th>
              <th className={styles.th}>Баллы в протоколе</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className={styles.row}>
                <td className={styles.cell}><strong>№ {r.place}</strong></td>
                <td className={styles.cell}>{r.name || `Участник #${r.athlete_id || r.team_id}`}</td>
                <td className={styles.cell}>{r.score_text || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardContent>
  </Card>
);
