"use client";

import type { ContestTask } from "@/shared/api";
import styles from "./TaskTabs.module.css";

interface Props {
  tasks: ContestTask[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function TaskTabs({ tasks, selectedId, onSelect }: Props) {
  return (
    <div className={styles.tabs}>
      {tasks.map((task, idx) => {
        const isActive = task.id === selectedId;
        const cls = isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab;
        return (
          <button
            key={task.id}
            type="button"
            className={cls}
            onClick={() => onSelect(task.id)}
          >
            <span className={styles.badge}>{idx + 1}</span>
            <span>{task.title}</span>
          </button>
        );
      })}
    </div>
  );
}
