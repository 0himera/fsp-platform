"use client";

import { CodeSubmitBox } from "./ui/CodeSubmitBox";
import { CSVSubmitBox } from "./ui/CSVSubmitBox";
import { RegisterPrompt } from "./ui/RegisterPrompt";
import styles from "./TaskSubmission.module.css";

interface Props {
  competitionId: number;
  taskId: number;
  mode: "algorithm" | "csv_metric";
  isRegistered: boolean;
  canSubmitNow: boolean;
  isUpcoming: boolean;
  isEnded: boolean;
  finalized: boolean;
  canRegister?: boolean;
  onRegister?: () => void;
  isRegisterPending?: boolean;
}

export function TaskSubmission({
  competitionId,
  taskId,
  mode,
  isRegistered,
  canSubmitNow,
  isUpcoming,
  isEnded,
  finalized,
  canRegister,
  onRegister,
  isRegisterPending,
}: Props) {
  if (finalized) return <p className={styles.status}>Контест завершён.</p>;
  if (isEnded) return <p className={styles.status}>Время турнира истекло. Приём решений окончен.</p>;
  if (isUpcoming) return <p className={styles.status}>Приём решений откроется после начала турнира.</p>;

  if (!isRegistered) {
    return (
      <RegisterPrompt
        canRegister={canRegister}
        onRegister={onRegister}
        isRegisterPending={isRegisterPending}
      />
    );
  }

  if (!canSubmitNow) return null;

  return mode === "algorithm" ? (
    <CodeSubmitBox competitionId={competitionId} taskId={taskId} />
  ) : (
    <CSVSubmitBox competitionId={competitionId} taskId={taskId} />
  );
}
