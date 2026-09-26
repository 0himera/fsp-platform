"use client";

import * as React from "react";
import { useCompetitionsQuery } from "@/entities/competition";
import {
  WEEKDAYS,
  getMonthDays,
  competitionsOnDay,
} from "../../model/calendarUtils";
import { useCalendarMonth } from "../../model/useCalendarMonth";
import { CalendarNav } from "../CalendarNav";
import { CalendarCell } from "../CalendarCell";
import { CalendarLegend } from "../CalendarLegend";
import styles from "./CalendarView.module.css";

export function CalendarView() {
  const { today, year, month, prevMonth, nextMonth } = useCalendarMonth();
  const { data: competitions = [] } = useCompetitionsQuery();
  const visible = competitions.filter((c) => c.status !== "draft");
  const days = getMonthDays(year, month);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.heading}>
          <div>
            <span>Федерация спортивного программирования РД</span>
            <h1>Календарь соревнований</h1>
          </div>
        </header>
        <CalendarNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
        <div className={styles.grid}>
          {WEEKDAYS.map((wd) => (
            <div key={wd} className={styles.weekday}>{wd}</div>
          ))}
          {days.map((date, i) => (
            <CalendarCell
              key={i}
              date={date}
              isCurrentMonth={date.getMonth() === month}
              isToday={date.toDateString() === today.toDateString()}
              items={competitionsOnDay(visible, date)}
            />
          ))}
        </div>
        <CalendarLegend />
      </div>
    </main>
  );
}
