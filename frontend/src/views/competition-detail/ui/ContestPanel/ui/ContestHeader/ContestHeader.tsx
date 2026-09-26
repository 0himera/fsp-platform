"use client";

import Link from "next/link";
import type { Contest } from "@/shared/api";
import styles from "./ContestHeader.module.css";

interface Props {
  contest: Contest;
  isOrganizer: boolean;
  isUpcoming: boolean;
}

export function ContestHeader({ contest, isOrganizer, isUpcoming }: Props) {
  const modeLabel = contest.mode === "algorithm" ? "Алгоритмический контест" : "CSV · recall";

  return (
    <div className={styles.intro}>
      <span className={styles.mode}>{modeLabel}</span>
      {contest.instructions && <p className={styles.instructions}>{contest.instructions}</p>}
      {!isOrganizer && isUpcoming && (
        <p className={styles.notice}>Задания и отправка решений откроются после старта соревнования.</p>
      )}
      {contest.finalized && (
        <p className={styles.notice}>Контест завершён. Итоговый протокол опубликован.</p>
      )}
      {contest.mode === "algorithm" && (
        <Link href={`/competitions/${contest.competition_id}/contest`} className={styles.arenaLink}>
          Открыть интерактивную Арену (IDE) →
        </Link>
      )}
    </div>
  );
}
