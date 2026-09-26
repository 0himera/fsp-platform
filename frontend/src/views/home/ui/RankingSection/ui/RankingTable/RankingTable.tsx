import * as React from "react";
import { Card, CardContent } from "@/shared/ui";
import type { Athlete } from "@/shared/api";
import { RankingTableRow } from "../RankingTableRow";
import styles from "./RankingTable.module.css";

interface RankingTableProps {
  athletes: Athlete[];
}

export const RankingTable: React.FC<RankingTableProps> = ({ athletes }) => (
  <Card className={styles.tableCard}>
    <CardContent className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>№</th>
            <th className={styles.th}>Спортсмен</th>
            <th className={styles.th}>Город / Вуз</th>
            <th className={styles.th}>Разряд</th>
            <th className={`${styles.th} ${styles.numberCol}`}>Турниры</th>
            <th className={`${styles.th} ${styles.numberCol}`}>Разряд</th>
            <th className={`${styles.th} ${styles.numberCol}`}>Итого</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => (
            <RankingTableRow key={athlete.id} athlete={athlete} />
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);
