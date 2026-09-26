import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS } from "../../model/calendarUtils";
import styles from "./CalendarNav.module.css";

interface CalendarNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export const CalendarNav: React.FC<CalendarNavProps> = ({ year, month, onPrev, onNext }) => (
  <div className={styles.nav}>
    <button type="button" className={styles.navBtn} onClick={onPrev} aria-label="Предыдущий месяц">
      <ChevronLeft size={18} />
    </button>
    <span className={styles.monthTitle}>{MONTHS[month]} {year}</span>
    <button type="button" className={styles.navBtn} onClick={onNext} aria-label="Следующий месяц">
      <ChevronRight size={18} />
    </button>
  </div>
);
