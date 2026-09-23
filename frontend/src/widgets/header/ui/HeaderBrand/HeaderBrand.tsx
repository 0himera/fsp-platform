import * as React from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/shared/config";
import styles from "./HeaderBrand.module.css";

export const HeaderBrand: React.FC = () => {
  return (
    <Link href="/" className={styles.brandWrapper}>
      <div className={styles.logoBadge}>ФСП</div>
      <div className={styles.titleBlock}>
        <span className={styles.title}>{APP_CONFIG.shortName}</span>
        <span className={styles.subtitle}>{APP_CONFIG.festival}</span>
      </div>
    </Link>
  );
};
