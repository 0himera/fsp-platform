import React from "react";
import styles from "./SlideDots.module.css";

interface SlideDotsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export const SlideDots: React.FC<SlideDotsProps> = ({
  total,
  current,
  onSelect,
}) => (
  <div className={styles.dots}>
    {Array.from({ length: total }).map((_, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => onSelect(idx)}
        className={`${styles.dot} ${idx === current ? styles.activeDot : ""}`}
        aria-label={`Слайд ${idx + 1}`}
      />
    ))}
  </div>
);
