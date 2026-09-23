import * as React from "react";
import styles from "./CompetitionsHeader.module.css";

export const CompetitionsHeader: React.FC = () => (
  <div className={styles.header}>
    <h2 className={styles.heading}>Соревнования Республики Дагестан</h2>
    <p className={styles.description}>
      Официальные старты, этапы отбора и итоговые турниры
    </p>
  </div>
);
