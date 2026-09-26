"use client";

import type { Competition } from "@/shared/api";
import { Button } from "@/shared/ui";
import { useStartCompetitionEarlyMutation } from "@/features/manage-competition";
import styles from "./StartEarlyControl.module.css";

interface Props {
  competition: Competition;
  hasTasks: boolean;
  isLoadingContest: boolean;
}

export function StartEarlyControl({ competition, hasTasks, isLoadingContest }: Props) {
  const startEarly = useStartCompetitionEarlyMutation();
  const canStart = competition.status === "open" && competition.phase === "upcoming";

  if (!canStart) return null;

  const handleStart = () => {
    if (window.confirm("Начать контест сейчас? Приём заявок закроется, задания и отправка решений откроются.")) {
      startEarly.mutate(competition.id);
    }
  };

  return (
    <div className={styles.row}>
      <p className={styles.text}>
        {hasTasks
          ? "Можно открыть задания и приём решений раньше расписания."
          : "Чтобы начать контест раньше, сначала создайте его и добавьте задания."}
      </p>
      <Button
        variant="secondary"
        disabled={!hasTasks || isLoadingContest || startEarly.isPending}
        onClick={handleStart}
      >
        {startEarly.isPending ? "Запускаем…" : "Начать контест сейчас"}
      </Button>
    </div>
  );
}
