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

  const handleFinalize = () => {
    setErrorText("");
    finalize.mutate(undefined, {
      onError: (err) => setErrorText(err instanceof Error ? err.message : "Не удалось завершить контест"),
    });
  };

  return (
    <div className={styles.finalize}>
      <p className={styles.text}>
        {mayFinalize
          ? "Все оценки будут внесены в протокол турнира и учтены в рейтинге."
          : "Завершить контест можно после окончания времени турнира."}
      </p>
      <Button variant="secondary" disabled={!mayFinalize || finalize.isPending} onClick={handleFinalize}>
        {finalize.isPending ? "Публикация…" : "Завершить и опубликовать результаты"}
      </Button>
      {errorText && <p className={styles.error}>{errorText}</p>}
    </div>
  );
}
