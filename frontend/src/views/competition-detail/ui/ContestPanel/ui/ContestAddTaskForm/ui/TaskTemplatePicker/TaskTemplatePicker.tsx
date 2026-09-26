"use client";

import * as React from "react";
import { getTemplatesForMode, TaskTemplate } from "@/entities/contest";
import styles from "./TaskTemplatePicker.module.css";

interface Props {
  mode: string;
  selectedId?: string;
  onSelect: (tpl: TaskTemplate) => void;
}

export function TaskTemplatePicker({ mode, selectedId, onSelect }: Props) {
  const templates = React.useMemo(() => getTemplatesForMode(mode), [mode]);
  if (templates.length === 0) return null;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Готовые примеры заданий:</span>
      <div className={styles.chips}>
        {templates.map((tpl) => {
          const isActive = selectedId === tpl.id;
          const cls = isActive ? `${styles.chip} ${styles.chipActive}` : styles.chip;
          return (
            <button
              key={tpl.id}
              type="button"
              className={cls}
              onClick={() => onSelect(tpl)}
            >
              {tpl.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
