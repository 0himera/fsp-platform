"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useCreateContestMutation } from "@/entities/contest";
import styles from "./ContestCreateForm.module.css";

interface Props {
  competitionId: number;
}

export function ContestCreateForm({ competitionId }: Props) {
  const createContest = useCreateContestMutation(competitionId);
  const [mode, setMode] = React.useState<"algorithm" | "csv_metric">("algorithm");
  const [instructions, setInstructions] = React.useState("");
  const [errorText, setErrorText] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorText("");
    createContest.mutate(
      { mode, instructions },
      {
        onError: (err) => setErrorText(err instanceof Error ? err.message : "Не удалось создать контест"),
      }
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.text}>Выберите режим и создайте контест для этого турнира.</p>
      <label className={styles.field}>
        Режим
        <select className={styles.select} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="algorithm">Алгоритмические задачи</option>
          <option value="csv_metric">Проверка CSV по recall</option>
        </select>
      </label>
      <label className={styles.field}>
        Инструкция участникам
        <textarea className={styles.textarea} value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
      </label>
      {errorText && <p className={styles.error}>{errorText}</p>}
      <Button type="submit" disabled={createContest.isPending}>
        {createContest.isPending ? "Создание…" : "Создать контест"}
      </Button>
    </form>
  );
}
