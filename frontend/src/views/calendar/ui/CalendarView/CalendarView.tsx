"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCompetitionsQuery } from "@/entities/competition";
import type { Competition } from "@/shared/api";
import styles from "./CalendarView.module.css";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

function phaseClass(phase: string) {
  const map: Record<string, string> = {
    upcoming: styles.phaseUpcoming,
    current: styles.phaseCurrent,
    awaiting_results: styles.phaseAwaiting,
    completed: styles.phaseCompleted,
  };
  return map[phase] ?? styles.phaseUpcoming;
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = -startDow; i < last.getDate(); i++) {
    days.push(new Date(year, month, 1 + i));
  }
  while (days.length % 7 !== 0) days.push(new Date(year, month, days.length - startDow + 1));
  return days;
}

function competitionsOnDay(competitions: Competition[], date: Date): Competition[] {
  // Using local date formatting assuming the dates in API match local timezone or we just compare ISO prefixes
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return competitions.filter((c) => {
    const start = c.starts_at.slice(0, 10);
    const end = c.ends_at.slice(0, 10);
    return start <= d && d <= end;
  });
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const { data: competitions = [] } = useCompetitionsQuery();
  const visible = competitions.filter((c) => c.status !== "draft");

  const days = getMonthDays(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.heading}>
          <div>
            <span>Федерация спортивного программирования РД</span>
            <h1>Календарь соревнований</h1>
          </div>
        </header>
        <div className={styles.nav}>
          <button type="button" className={styles.navBtn} onClick={prevMonth} aria-label="Предыдущий месяц">
            <ChevronLeft size={18} />
          </button>
          <span className={styles.monthTitle}>{MONTHS[month]} {year}</span>
          <button type="button" className={styles.navBtn} onClick={nextMonth} aria-label="Следующий месяц">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className={styles.grid}>
          {WEEKDAYS.map((wd) => <div key={wd} className={styles.weekday}>{wd}</div>)}
          {days.map((date, i) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === today.toDateString();
            const items = competitionsOnDay(visible, date);
            return (
              <div key={i} className={`${styles.day} ${!isCurrentMonth ? styles.dayOther : ""} ${isToday ? styles.dayToday : ""}`}>
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
          })}
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.phaseUpcoming}`} /> Предстоящее</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.phaseCurrent}`} /> Идёт</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.phaseAwaiting}`} /> Ожидает итогов</div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.phaseCompleted}`} /> Завершено</div>
        </div>
      </div>
    </main>
  );
}
