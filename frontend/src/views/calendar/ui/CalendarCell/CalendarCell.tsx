import * as React from "react";
import Link from "next/link";
import type { Competition } from "@/shared/api";
import styles from "./CalendarCell.module.css";

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: Competition[];
}

function phaseClass(phase: string) {
  const map: Record<string, string> = {
    upcoming: styles.phaseUpcoming,
    current: styles.phaseCurrent,
    awaiting_results: styles.phaseAwaiting,
    completed: styles.phaseCompleted,
  };
  return map[phase] ?? styles.phaseUpcoming;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({
  date,
  isCurrentMonth,
  isToday,
  items,
}) => (
  <div className={`${styles.day} ${!isCurrentMonth ? styles.dayOther : ""} ${isToday ? styles.dayToday : ""}`}>
    <span className={styles.dayNum}>{date.getDate()}</span>
    <div className={styles.events}>
      {items.slice(0, 3).map((c) => (
        <Link key={c.id} href={`/competitions/${c.id}`} className={`${styles.chip} ${phaseClass(c.phase)}`} title={c.title}>
          {c.title.length > 20 ? c.title.slice(0, 18) + "…" : c.title}
        </Link>
      ))}
      {items.length > 3 && <span className={styles.more}>+{items.length - 3}</span>}
    </div>
  </div>
);
