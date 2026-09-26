"use client";

import type { ContestTask } from "@/shared/api";
import { TaskSubmission } from "../TaskSubmission";
import styles from "./ContestTaskList.module.css";

interface Props {
  competitionId: number;
  tasks: ContestTask[];
  mode: "algorithm" | "csv_metric";
  isOrganizer: boolean;
  isRegistered: boolean;
  canSubmitNow: boolean;
  isUpcoming: boolean;
  isEnded: boolean;
  finalized: boolean;
  canRegister?: boolean;
  onRegister?: () => void;
  isRegisterPending?: boolean;
}

export function ContestTaskList({ tasks, competitionId, mode, isOrganizer, ...submissionProps }: Props) {
  return (
    <div className={styles.tasks}>
      {tasks.map((task, index) => (
        <article className={styles.task} key={task.id}>
          <div className={styles.heading}>
            <h3 className={styles.title}>{index + 1}. {task.title}</h3>
            <span className={styles.points}>{task.max_points} баллов</span>
          </div>
          <p className={styles.statement}>{task.statement}</p>
          {task.public_csv && (
            <details className={styles.fileDetails}>
              <summary>Открытые данные задания</summary>
              <pre className={styles.code}>{task.public_csv}</pre>
            </details>
          )}
          {!isOrganizer && (
            <TaskSubmission
              competitionId={competitionId}
              taskId={task.id}
              mode={mode}
              {...submissionProps}
            />
          )}
        </article>
      ))}
    </div>
  );
}
