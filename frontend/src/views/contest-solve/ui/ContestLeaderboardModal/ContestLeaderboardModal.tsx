"use client";

import { X } from "lucide-react";
import { useContestLeaderboardQuery } from "@/entities/contest";
import { LeaderboardTable } from "./ui/LeaderboardTable";
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
          <button type="button" className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.body}>
          {isLoading && <p className={styles.td}>Загрузка таблицы лидеров…</p>}
          {!isLoading && leaders.length === 0 && <p className={styles.td}>Пока нет решений.</p>}
          {leaders.length > 0 && <LeaderboardTable leaders={leaders} />}
        </div>
      </div>
    </div>
  );
}
