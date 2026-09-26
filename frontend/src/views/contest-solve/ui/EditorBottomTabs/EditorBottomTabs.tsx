"use client";

import type { BottomTab } from "../../model/types";
import styles from "./EditorBottomTabs.module.css";

interface Props {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  submissionCount: number;
}

export function EditorBottomTabs({ activeTab, onTabChange, submissionCount }: Props) {
  return (
    <div className={styles.tabBar}>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === "result" ? styles.tabActive : ""}`}
        onClick={() => onTabChange("result")}
      >
        Результат проверки
      </button>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === "history" ? styles.tabActive : ""}`}
        onClick={() => onTabChange("history")}
      >
        <span>Мои попытки</span>
        {submissionCount > 0 && <span className={styles.badge}>{submissionCount}</span>}
      </button>
    </div>
  );
}
