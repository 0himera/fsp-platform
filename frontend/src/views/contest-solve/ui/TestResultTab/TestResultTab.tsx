"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { ContestSubmission } from "@/shared/api";
import styles from "./TestResultTab.module.css";

interface Props {
  submission?: ContestSubmission;
  maxPoints?: number;
}

export function TestResultTab({ submission, maxPoints }: Props) {
  if (!submission) {
    return <div className={styles.empty}>Нажмите &laquo;Запустить решение&raquo;, чтобы проверить код.</div>;
  }

  const isAccepted = submission.verdict.toLowerCase().includes("accepted") || submission.verdict.toLowerCase().includes("принят");
  const isWrong = submission.verdict.toLowerCase().includes("wrong");
  const bannerCls = isAccepted
    ? `${styles.banner} ${styles.bannerAccepted}`
    : isWrong
    ? `${styles.banner} ${styles.bannerWrong}`
    : `${styles.banner} ${styles.bannerOther}`;

  const Icon = isAccepted ? CheckCircle2 : isWrong ? XCircle : AlertCircle;

  return (
    <div className={styles.container}>
      <div className={bannerCls}>
        <div className={styles.verdictTitle}>
          <Icon size={18} />
          <span>{submission.verdict}</span>
        </div>
        {submission.score !== undefined && submission.score !== null && (
          <div className={styles.scoreBadge}>
            {submission.score} / {maxPoints ?? 100} б.
          </div>
        )}
      </div>
      {submission.feedback && (
        <div className={styles.feedbackBox}>{submission.feedback}</div>
      )}
    </div>
  );
}
