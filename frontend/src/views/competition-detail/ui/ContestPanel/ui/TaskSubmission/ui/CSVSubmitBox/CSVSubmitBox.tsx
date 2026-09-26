"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useSubmitCSVMutation } from "@/entities/contest";
import styles from "./CSVSubmitBox.module.css";

interface Props {
  competitionId: number;
  taskId: number;
}

export function CSVSubmitBox({ competitionId, taskId }: Props) {
  const submitCSV = useSubmitCSVMutation(competitionId);
  const [file, setFile] = React.useState<File | undefined>();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!file) return;
    submitCSV.mutate(
      { taskId, file },
      {
        onSuccess: () => {
          setFile(undefined);
          if (inputRef.current) inputRef.current.value = "";
        },
      }
    );
  };

  return (
    <div className={styles.box}>
      <label className={styles.label} htmlFor={`csv-${taskId}`}>
        Загрузить CSV с колонками id,prediction (до 2 МБ)
      </label>
      <Input
        ref={inputRef}
        className={styles.input}
        id={`csv-${taskId}`}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <Button
        size="sm"
        disabled={submitCSV.isPending || !file}
        onClick={handleSubmit}
      >
        {submitCSV.isPending ? "Загрузка…" : "Загрузить решение"}
      </Button>
    </div>
  );
}
