import React from "react";
import styles from "./SlideHeader.module.css";

interface SlideHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  highlights: string[];
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({
  badge,
  title,
  subtitle,
  highlights,
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.badge}>{badge}</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.highlights}>
        {highlights.map((h, i) => (
          <span key={i} className={styles.tag}>
            {h}
          </span>
        ))}
      </div>
    </div>
  );
};
