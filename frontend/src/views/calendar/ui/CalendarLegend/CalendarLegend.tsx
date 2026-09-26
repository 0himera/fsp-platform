import * as React from "react";
import styles from "./CalendarLegend.module.css";

const LEGEND_ITEMS = [
  { label: "Предстоящее", phaseClass: styles.phaseUpcoming },
  { label: "Идёт", phaseClass: styles.phaseCurrent },
  { label: "Ожидает итогов", phaseClass: styles.phaseAwaiting },
  { label: "Завершено", phaseClass: styles.phaseCompleted },
];

export const CalendarLegend: React.FC = () => (
  <div className={styles.legend}>
    {LEGEND_ITEMS.map((item) => (
      <div key={item.label} className={styles.legendItem}>
        <span className={`${styles.legendDot} ${item.phaseClass}`} />
        {item.label}
      </div>
    ))}
  </div>
);
