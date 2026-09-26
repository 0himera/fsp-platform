"use client";

import { X } from "lucide-react";
import { useContestLeaderboardQuery } from "@/entities/contest";
import styles from "./ContestLeaderboardModal.module.css";

interface Props {
  competitionId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ContestLeaderboardModal({ competitionId, isOpen, onClose }: Props) {
  const { data: leaders = [], isLoading } = useContestLeaderboardQuery(competitionId, isOpen);
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Лидерборд контеста</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          {isLoading && <p className={styles.td}>Загрузка таблицы лидеров…</p>}
          {!isLoading && leaders.length === 0 && <p className={styles.td}>Пока нет проверенных решений.</p>}
          {leaders.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>#</th>
                  <th className={styles.th}>Участник</th>
                  <th className={`${styles.th} ${styles.alignRight}`}>Баллы</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader) => (
                  <tr key={leader.athlete_id}>
                    <td className={`${styles.td} ${styles.placeBadge}`}>{leader.place}</td>
                    <td className={styles.td}>{leader.full_name}</td>
                    <td className={`${styles.td} ${styles.score} ${styles.alignRight}`}>
                      {leader.score} / {leader.max_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
