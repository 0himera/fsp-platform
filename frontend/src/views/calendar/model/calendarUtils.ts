import type { Competition } from "@/shared/api";

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = -startDow; i < last.getDate(); i++) {
    days.push(new Date(year, month, 1 + i));
  }
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month, days.length - startDow + 1));
  }
  return days;
}

export function competitionsOnDay(competitions: Competition[], date: Date): Competition[] {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return competitions.filter((c) => {
    const start = c.starts_at.slice(0, 10);
    const end = c.ends_at.slice(0, 10);
    return start <= d && d <= end;
  });
}
