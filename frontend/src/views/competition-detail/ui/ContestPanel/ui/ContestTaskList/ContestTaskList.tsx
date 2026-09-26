"use client";

import Link from "next/link";
import type { ContestTask } from "@/shared/api";
import { Button } from "@/shared/ui";
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
          {!isOrganizer && mode === "algorithm" && submissionProps.canSubmitNow && (
            <Link href={`/competitions/${competitionId}/contest`} className={styles.solveLink}>
              Решать задачу онлайн →
            </Link>
          )}
          {!isOrganizer && mode === "algorithm" && !submissionProps.canSubmitNow && submissionProps.canRegister && (
            <Button size="sm" onClick={submissionProps.onRegister} disabled={submissionProps.isRegisterPending}>
              {submissionProps.isRegisterPending ? "Регистрация…" : "Зарегистрироваться для участия"}
            </Button>
          )}
          {!isOrganizer && mode === "csv_metric" && (
            <TaskSubmission competitionId={competitionId} taskId={task.id} mode={mode} {...submissionProps} />
          )}
        </article>
      ))}
    </div>
  );
}
