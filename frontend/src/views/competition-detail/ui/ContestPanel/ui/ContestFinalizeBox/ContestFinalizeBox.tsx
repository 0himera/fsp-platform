"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useFinalizeContestMutation } from "@/entities/contest";
import styles from "./ContestFinalizeBox.module.css";

interface Props {
  competitionId: number;
  mayFinalize: boolean;
}

export function ContestFinalizeBox({ competitionId, mayFinalize }: Props) {
  const finalize = useFinalizeContestMutation(competitionId);
  const [errorText, setErrorText] = React.useState("");

  const handleFinalize = (force = false) => {
    setErrorText("");
    finalize.mutate(
      { force },
      {
        onError: (err) =>
          setErrorText(err instanceof Error ? err.message : "Не удалось завершить контест"),
      }
    );
  };

  return (
    <div className={styles.finalize}>
      <p className={styles.text}>
        {mayFinalize
          ? "Все оценки будут внесены в протокол турнира и учтены в рейтинге."
          : "Завершить контест можно после окончания времени турнира."}
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={!mayFinalize || finalize.isPending}
          onClick={() => handleFinalize(false)}
        >
          {finalize.isPending ? "Публикация…" : "Завершить и опубликовать результаты"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={styles.forceBtn}
          disabled={finalize.isPending}
          onClick={() => handleFinalize(true)}
          title="Завершить турнир и опубликовать текущие результаты"
        >
          {finalize.isPending ? "Завершение…" : "Форсированное завершение"}
        </Button>
      </div>
      {errorText && <p className={styles.error}>{errorText}</p>}
    </div>
  );
}
