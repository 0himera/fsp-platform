"use client";

import type { ContestSubmission } from "@/shared/api";
import { useReviewContestSubmissionMutation } from "@/entities/contest";
import { SubmissionReviewRow } from "./ui/SubmissionReviewRow";
import styles from "./ContestSubmissionsList.module.css";

interface Props {
  competitionId: number;
  submissions: ContestSubmission[];
  isOrganizer: boolean;
  editable: boolean;
}

const statusLabels: Record<string, string> = {
  submitted: "На проверке",
  queued: "В очереди",
  checking: "Проверяется",
  graded: "Проверено",
  invalid: "Ошибка проверки",
};

export function ContestSubmissionsList({ competitionId, submissions, isOrganizer, editable }: Props) {
  const review = useReviewContestSubmissionMutation(competitionId);
  if (!submissions.length) return null;

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{isOrganizer ? "Поступившие решения" : "Мои отправки"}</h3>
      <div className={styles.list}>
        {isOrganizer
          ? submissions.map((sub) => (
              <SubmissionReviewRow
                key={sub.id}
                submission={sub}
                pending={review.isPending}
                editable={editable}
                onReview={(score, feedback) => review.mutate({ submissionId: sub.id, score, feedback })}
              />
            ))
          : submissions.map((sub) => (
              <p className={styles.item} key={sub.id}>
                {sub.task_title}: {statusLabels[sub.status] || sub.status}
                {sub.score !== undefined ? ` · ${sub.score} баллов` : ""}
                {sub.feedback ? ` · ${sub.feedback}` : ""}
              </p>
            ))}
      </div>
    </div>
  );
}
