import * as React from "react";
import { APP_CONFIG } from "@/shared/config";
import styles from "./HeroSection.module.css";

export const HeroSection: React.FC = () => {
  return (
    <section className={styles.hero}>
      <span className={styles.badge}>{APP_CONFIG.stage}</span>
      <h1 className={styles.title}>{APP_CONFIG.appName}</h1>
      <p className={styles.subtitle}>
        Единая информационная система Федерации спортивного программирования Республики Дагестан для спортсменов, организаторов, результатов соревнований и пересчета регионального рейтинга.
      </p>
    </section>
  );
};
