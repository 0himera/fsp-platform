"use client";

import * as React from "react";
import type { ContestSubmission } from "@/shared/api";
import { Button, Input } from "@/shared/ui";
import styles from "./SubmissionReviewRow.module.css";

interface Props {
  submission: ContestSubmission;
  onReview: (score: number, feedback: string) => void;
  pending: boolean;
  editable: boolean;
}

const statusLabels: Record<string, string> = {
  submitted: "На проверке",
  queued: "В очереди",
  checking: "Проверяется",
  graded: "Проверено",
  invalid: "Ошибка проверки",
};

export function SubmissionReviewRow({ submission, onReview, pending, editable }: Props) {
  const canReview = editable && submission.status !== "queued" && submission.status !== "checking";

  const handleReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onReview(Number(form.get("score")), String(form.get("feedback") ?? ""));
  };

  return (
    <article className={styles.submission}>
      <div className={styles.top}>
        <strong>{submission.athlete_name || "Участник"}</strong>
        <span className={styles.meta}>{submission.task_title} · {statusLabels[submission.status] || submission.status}</span>
      </div>
      {submission.source_code && <pre className={styles.code}>{submission.source_code}</pre>}
      {submission.file_name && <pre className={styles.code}>{submission.file_content}</pre>}
      {(submission.score !== undefined || submission.automatic_score !== undefined) && (
        <p className={styles.feedback}>
          Баллы: {submission.score ?? submission.automatic_score} · {submission.verdict}
        </p>
      )}
      {canReview && (
        <form className={styles.form} onSubmit={handleReview}>
          <Input name="score" type="number" min="0" step="0.01" defaultValue={submission.score ?? submission.automatic_score ?? 0} />
          <Input name="feedback" placeholder="Комментарий" defaultValue={submission.feedback} />
          <Button size="sm" type="submit" disabled={pending}>Оценить</Button>
        </form>
      )}
    </article>
  );
}
