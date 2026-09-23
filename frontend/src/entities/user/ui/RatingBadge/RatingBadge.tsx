import * as React from "react";
import styles from "./RatingBadge.module.css";

interface RatingBadgeProps {
  rating: number;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating }) => {
  return (
    <div className={styles.ratingBadge}>
      <span className={styles.ratingLabel}>Рейтинг ФСП</span>
      <span className={styles.ratingValue}>{rating}</span>
    </div>
  );
};
