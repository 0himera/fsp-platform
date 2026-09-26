import * as React from "react";
import type { Athlete } from "@/shared/api";
import styles from "./AthleteStatsRow.module.css";

interface AthleteStatsRowProps {
  athlete: Athlete;
}

export const AthleteStatsRow: React.FC<AthleteStatsRowProps> = ({ athlete }) => (
  <div className={styles.statsRow}>
    <div className={styles.statItem}>
      <span className={styles.statLabel}>Место в рейтинге</span>
      <span className={styles.statValue}>№ {athlete.rating_place || "—"}</span>
    </div>
    <div className={styles.statItem}>
      <span className={styles.statLabel}>Рейтинг arena-2</span>
      <span className={styles.statValue}>{athlete.rating}</span>
    </div>
    <div className={styles.statItem}>
      <span className={styles.statLabel}>Очки за турниры</span>
      <span className={styles.statValue}>{athlete.result_points}</span>
    </div>
    <div className={styles.statItem}>
      <span className={styles.statLabel}>Бонус разряда</span>
      <span className={styles.statValue}>{athlete.rank_points}</span>
    </div>
  </div>
);
