"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useCreateContestTaskMutation, TaskTemplate } from "@/entities/contest";
import { TaskTemplatePicker } from "./ui/TaskTemplatePicker";
import { parseLabels } from "./lib/parseLabels";
import styles from "./ContestAddTaskForm.module.css";

interface Props {
  competitionId: number;
  mode: string;
}

export function ContestAddTaskForm({ competitionId, mode }: Props) {
  const createTask = useCreateContestTaskMutation(competitionId);
  const [selectedId, setSelectedId] = React.useState<string>();
  const [title, setTitle] = React.useState("");
  const [statement, setStatement] = React.useState("");
  const [maxPoints, setMaxPoints] = React.useState("100");
  const [labelsText, setLabelsText] = React.useState("");
  const [publicCSV, setPublicCSV] = React.useState("");
  const [expectedLabels, setExpectedLabels] = React.useState<Record<string, string>>();
  const [errorText, setErrorText] = React.useState("");

  const handleSelect = (tpl: TaskTemplate) => {
    setSelectedId(tpl.id);
    setTitle(tpl.title);
    setStatement(tpl.statement);
    setMaxPoints(String(tpl.maxPoints));
    if (tpl.publicCsv) setPublicCSV(tpl.publicCsv);
    if (tpl.labelsText) setLabelsText(tpl.labelsText);
    if (tpl.expectedLabels) setExpectedLabels(tpl.expectedLabels);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    const expected = mode === "csv_metric" ? parseLabels(labelsText) : expectedLabels;
    createTask.mutate(
      { title, statement, max_points: Number(maxPoints), public_csv: publicCSV, expected_labels: expected },
      {
        onSuccess: () => { setTitle(""); setStatement(""); setLabelsText(""); setPublicCSV(""); setSelectedId(undefined); },
        onError: (err) => setErrorText(err instanceof Error ? err.message : "Не удалось добавить задание"),
      }
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Добавить задание</h3>
      <TaskTemplatePicker mode={mode} selectedId={selectedId} onSelect={handleSelect} />
      <Input required maxLength={160} placeholder="Название задания" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className={styles.textarea} required maxLength={12000} rows={4} placeholder="Условие и формат решения" value={statement} onChange={(e) => setStatement(e.target.value)} />
      <label className={styles.field}>Максимум баллов<Input required type="number" min="1" step="0.01" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} /></label>
      {mode === "csv_metric" && <textarea className={styles.textarea} required rows={3} placeholder="Открытые данные (CSV)" value={publicCSV} onChange={(e) => setPublicCSV(e.target.value)} />}
      {mode === "csv_metric" && <textarea className={styles.textarea} required rows={3} placeholder="Эталонные метки: id,label" value={labelsText} onChange={(e) => setLabelsText(e.target.value)} />}
      {errorText && <p className={styles.error}>{errorText}</p>}
      <Button type="submit" disabled={createTask.isPending}>{createTask.isPending ? "Добавление…" : "Добавить задание"}</Button>
    </form>
  );
}
