import * as React from "react";
import { EVENT_LEVEL_OPTIONS } from "../../model/filterOptions";
import styles from "./EventCategorySelects.module.css";

interface EventCategorySelectsProps {
  discipline: string;
  level: string;
  disciplines: { code: string; name: string }[];
  onDiscipline: (value: string) => void;
  onLevel: (value: string) => void;
}

export const EventCategorySelects: React.FC<EventCategorySelectsProps> = ({
  discipline,
  level,
  disciplines,
  onDiscipline,
  onLevel,
}) => (
  <>
    <select
      className={styles.select}
      value={discipline}
      onChange={(e) => onDiscipline(e.target.value)}
      aria-label="Фильтр по дисциплине"
    >
      <option value="all">Все дисциплины</option>
      {disciplines.map((d) => (
        <option key={d.code} value={d.code}>{d.name}</option>
      ))}
    </select>
    <select
      className={styles.select}
      value={level}
      onChange={(e) => onLevel(e.target.value)}
      aria-label="Фильтр по уровню"
    >
      {EVENT_LEVEL_OPTIONS.map((l) => (
        <option key={l.value} value={l.value}>{l.label}</option>
      ))}
    </select>
  </>
);
