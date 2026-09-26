"use client";

import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui";
import styles from "./EditorToolbar.module.css";

interface Props {
  onReset: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function EditorToolbar({ onReset, onSubmit, submitting }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <span className={styles.langBadge}>Python 3</span>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={onReset}
          disabled={submitting}
        >
          <RotateCcw size={12} />
          <span>Сбросить</span>
        </button>
      </div>
      <Button
        type="button"
        size="sm"
        className={styles.submitBtn}
        onClick={onSubmit}
        disabled={submitting}
      >
        <Play size={14} />
        {submitting ? "Проверка…" : "Запустить решение"}
      </Button>
    </div>
  );
}
