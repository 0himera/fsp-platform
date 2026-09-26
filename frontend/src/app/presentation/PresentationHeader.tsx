import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TimerBar } from "./TimerBar";
import styles from "./PresentationHeader.module.css";

export const PresentationHeader: React.FC = () => {
  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>На платформу</span>
        </Link>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>ФСП Дагестан</span>
          <span className={styles.brandBadge}>Защита хакатона</span>
        </div>
      </div>
      <TimerBar />
    </header>
  );
};
