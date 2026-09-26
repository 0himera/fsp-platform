"use client";

import * as React from "react";
import type { RankChange } from "@/shared/api";
import styles from "./RankHistory.module.css";

const RANK_LABELS: Record<string, string> = {
  none: "Без разряда",
  III: "III разряд",
  II: "II разряд",
  I: "I разряд",
  KMS: "Кандидат в мастера спорта",
  MS: "Мастер спорта",
  MSMK: "Мастер спорта международного класса",
  ZMS: "Заслуженный мастер спорта",
};

interface Props {
  history: RankChange[];
}

export function RankHistory({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>История изменения разряда</h3>
      <ol className={styles.list}>
        {history.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.date}>
              {new Date(item.changed_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className={styles.change}>
              <span className={styles.old}>{RANK_LABELS[item.old_rank_code] ?? item.old_rank_code}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.newRank}>{RANK_LABELS[item.new_rank_code] ?? item.new_rank_code}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
