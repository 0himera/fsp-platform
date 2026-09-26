"use client";

import type { ContestSubmission } from "@/shared/api";
import styles from "./SubmissionsHistoryTab.module.css";

interface Props {
  submissions: ContestSubmission[];
  onLoadCode?: (code: string) => void;
}

export function SubmissionsHistoryTab({ submissions, onLoadCode }: Props) {
  if (submissions.length === 0) {
    return <div className={styles.empty}>Вы еще не отправляли попыток по этой задаче.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {submissions.map((sub) => {
          const isAcc = sub.verdict.toLowerCase().includes("accepted") || sub.verdict.toLowerCase().includes("принят");
          const isWrong = sub.verdict.toLowerCase().includes("wrong");
          const badgeCls = isAcc
            ? `${styles.verdictBadge} ${styles.badgeAccepted}`
            : isWrong
            ? `${styles.verdictBadge} ${styles.badgeWrong}`
            : `${styles.verdictBadge} ${styles.badgeOther}`;

          return (
            <div key={sub.id} className={styles.row}>
              <div className={styles.left}>
                <span className={badgeCls}>{sub.verdict}</span>
                <span className={styles.time}>
                  {new Date(sub.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <div className={styles.left}>
                {sub.score !== undefined && sub.score !== null && (
                  <span className={styles.score}>{sub.score} б.</span>
                )}
                {sub.source_code && onLoadCode && (
                  <button
                    type="button"
                    className={styles.loadBtn}
                    onClick={() => onLoadCode(sub.source_code!)}
                  >
                    Посмотреть код
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
