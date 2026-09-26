import React from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { SlideDots } from "./SlideDots";
import styles from "./SlideNav.module.css";

interface SlideNavProps {
  currentIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const SlideNav: React.FC<SlideNavProps> = ({
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onSelect,
  isFullscreen,
  onToggleFullscreen,
}) => (
  <div className={styles.navWrap}>
    <div className={styles.controls}>
      <button
        type="button"
        onClick={onPrev}
        disabled={currentIndex === 0}
        className={styles.navBtn}
        aria-label="Назад"
      >
        <ChevronLeft size={18} />
      </button>
      <span className={styles.counter}>{currentIndex + 1} / {totalSlides}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentIndex === totalSlides - 1}
        className={styles.navBtn}
        aria-label="Вперед"
      >
        <ChevronRight size={18} />
      </button>
    </div>
    <SlideDots total={totalSlides} current={currentIndex} onSelect={onSelect} />
    <div className={styles.extra}>
      <span className={styles.hint}>← → навигация</span>
      <button
        type="button"
        onClick={onToggleFullscreen}
        className={styles.navBtn}
        aria-label="Экран"
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  </div>
);
