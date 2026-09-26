"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import styles from "./TimerBar.module.css";

const TOTAL_SECONDS = 7 * 60;

export const TimerBar: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const toggle = () => setIsActive((prev) => !prev);
  const reset = () => {
    setIsActive(false);
    setSecondsLeft(TOTAL_SECONDS);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isWarning = secondsLeft <= 60 && secondsLeft > 0;
  const isExpired = secondsLeft === 0;

  return (
    <div className={styles.timerWrap}>
      <div className={styles.timerHeader}>
        <span className={`${styles.timerDisplay} ${isWarning ? styles.warning : ""} ${isExpired ? styles.expired : ""}`}>
          {timeFormatted}
        </span>
        <div className={styles.timerControls}>
          <button type="button" onClick={toggle} className={styles.btn} aria-label="Старт / Пауза">
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button type="button" onClick={reset} className={styles.btn} aria-label="Сброс">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <progress
        className={styles.progressBar}
        value={TOTAL_SECONDS - secondsLeft}
        max={TOTAL_SECONDS}
      />
    </div>
  );
};
