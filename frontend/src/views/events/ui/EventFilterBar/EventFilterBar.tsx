"use client";

import { Search } from "lucide-react";
import { Button, Input } from "@/shared/ui";
import styles from "./EventFilterBar.module.css";

type Filter = "all" | "active" | "completed";
interface Props {
  filter: Filter;
  search: string;
  discipline: string;
  level: string;
  disciplines: { code: string; name: string }[];
  onFilter: (value: Filter) => void;
  onSearch: (value: string) => void;
  onDiscipline: (value: string) => void;
  onLevel: (value: string) => void;
}

const options: [Filter, string][] = [["all", "Все"], ["active", "Предстоящие"], ["completed", "Прошедшие"]];
const levels = [
  { value: "all", label: "Все уровни" },
  { value: "all_russian", label: "Всероссийский" },
  { value: "interregional", label: "Межрегиональный" },
  { value: "rf_championship", label: "Чемпионат РФ" },
  { value: "rd_championship", label: "Чемпионат РД" },
  { value: "regional", label: "Региональный" },
];

export function EventFilterBar({
  filter, search, discipline, level, disciplines,
  onFilter, onSearch, onDiscipline, onLevel
}: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Фильтр соревнований">
        {options.map(([value, label]) => (
          <Button key={value} size="sm" variant={filter === value ? "default" : "ghost"} aria-pressed={filter === value} onClick={() => onFilter(value)}>{label}</Button>
        ))}
        
        <select
          className={styles.select}
          value={discipline}
          onChange={(e) => onDiscipline(e.target.value)}
          aria-label="Фильтр по дисциплине"
        >
          <option value="all">Все дисциплины</option>
          {disciplines.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>

        <select
          className={styles.select}
          value={level}
          onChange={(e) => onLevel(e.target.value)}
          aria-label="Фильтр по уровню"
        >
          {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <label className={styles.search}>
        <Search size={17} aria-hidden="true" />
        <Input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Название или город" />
      </label>
    </div>
  );
}
