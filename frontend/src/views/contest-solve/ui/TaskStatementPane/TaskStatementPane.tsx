"use client";

import * as React from "react";
import type { ContestTask } from "@/shared/api";
import { algorithmTemplates } from "@/entities/contest";
import { TaskExamples } from "../TaskExamples";
import styles from "./TaskStatementPane.module.css";

interface Props {
  task?: ContestTask;
}

export function TaskStatementPane({ task }: Props) {
  const examples = React.useMemo(() => {
    if (!task) return [];
    const tpl = algorithmTemplates.find(
      (t) => t.title.toLowerCase() === task.title.toLowerCase()
    );
    if (!tpl || !tpl.expectedLabels) return [];
    return Object.entries(tpl.expectedLabels).slice(0, 2).map(([k, v]) => ({
      input: k,
      output: v,
    }));
  }, [task]);

  if (!task) {
    return <div className={styles.pane}><p className={styles.statement}>Задание не найдено</p></div>;
  }

  return (
    <div className={styles.pane}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{task.title}</h1>
          <span className={styles.pointsBadge}>{task.max_points} баллов</span>
        </div>
      </div>
      <p className={styles.statement}>{task.statement}</p>
      {task.public_csv && (
        <div className={styles.publicData}>
          <details>
            <summary className={styles.statement}>Открытые данные (CSV)</summary>
            <pre className={styles.csvPre}>{task.public_csv}</pre>
          </details>
        </div>
      )}
      <TaskExamples examples={examples} />
    </div>
  );
}
