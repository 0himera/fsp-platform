"use client";

import { Search } from "lucide-react";
import { Button, Input } from "@/shared/ui";
import styles from "./EventFilterBar.module.css";

type Filter = "all" | "active" | "completed";
interface Props { filter: Filter; search: string; onFilter: (value: Filter) => void; onSearch: (value: string) => void; }
const options: [Filter, string][] = [["all", "Все события"], ["active", "Предстоящие"], ["completed", "Завершённые"]];

export function EventFilterBar({ filter, search, onFilter, onSearch }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Фильтр соревнований">
        {options.map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "default" : "ghost"} aria-pressed={filter === value} onClick={() => onFilter(value)}>{label}</Button>)}
      </div>
      <label className={styles.search}><Search size={17} aria-hidden="true" /><Input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Название, дисциплина или город" /></label>
    </div>
  );
}
