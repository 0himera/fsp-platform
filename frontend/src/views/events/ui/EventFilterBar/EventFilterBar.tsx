"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button, Input } from "@/shared/ui";
import {
  type EventFilterBarProps,
  EVENT_STATUS_OPTIONS,
} from "../../model/filterOptions";
import { EventCategorySelects } from "../EventCategorySelects";
import styles from "./EventFilterBar.module.css";

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  filter,
  search,
  discipline,
  level,
  disciplines,
  onFilter,
  onSearch,
  onDiscipline,
  onLevel,
}) => (
  <div className={styles.toolbar}>
    <div className={styles.filters} role="group" aria-label="Фильтр соревнований">
      {EVENT_STATUS_OPTIONS.map(([value, label]) => (
        <Button
          key={value}
          size="sm"
          variant={filter === value ? "default" : "ghost"}
          aria-pressed={filter === value}
          onClick={() => onFilter(value)}
        >
          {label}
        </Button>
      ))}
      <EventCategorySelects
        discipline={discipline}
        level={level}
        disciplines={disciplines}
        onDiscipline={onDiscipline}
        onLevel={onLevel}
      />
    </div>
    <label className={styles.search}>
      <Search size={17} aria-hidden="true" />
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Название или город"
      />
    </label>
  </div>
);
