"use client";

import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/shared/ui";
import type { ContestTask } from "@/shared/api";
import { TaskTabs } from "../TaskTabs";
import styles from "./SolveHeader.module.css";

interface Props {
  competitionId: number;
  tasks: ContestTask[];
  selectedId: number;
  onSelectTask: (id: number) => void;
  onOpenLeaderboard: () => void;
}

export function SolveHeader({ competitionId, tasks, selectedId, onSelectTask, onOpenLeaderboard }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href={`/competitions/${competitionId}`} className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>К турниру</span>
        </Link>
        <TaskTabs tasks={tasks} selectedId={selectedId} onSelect={onSelectTask} />
      </div>
      <div className={styles.right}>
        <Button
          type="button"
          variant="outline"
          className={styles.leaderboardBtn}
          onClick={onOpenLeaderboard}
        >
          <Trophy size={15} />
          <span>Лидерборд</span>
        </Button>
      </div>
    </header>
  );
}
