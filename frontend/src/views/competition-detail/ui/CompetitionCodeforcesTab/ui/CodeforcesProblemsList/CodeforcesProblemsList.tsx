"use client";

import type { CodeforcesProblem } from "@/entities/codeforces";
import styles from "./CodeforcesProblemsList.module.css";

interface Props {
  problems: CodeforcesProblem[];
}

export function CodeforcesProblemsList({ problems }: Props) {
  if (!problems.length) return null;

  return (
    <div className={styles.list}>
      {problems.map((p) => {
        const url = `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`;
        return (
          <div key={p.index} className={styles.item}>
            <div className={styles.left}>
              <span className={styles.badge}>{p.index}</span>
              <a href={url} target="_blank" rel="noreferrer" className={styles.name}>
                {p.name}
              </a>
              <div className={styles.tags}>
                {p.tags.slice(0, 3).map((t) => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>
            </div>
            <span className={styles.points}>
              {p.points > 0 ? `${p.points} PTS` : p.rating ? `Рейтинг: ${p.rating}` : "100 PTS"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
