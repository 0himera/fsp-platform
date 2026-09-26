import * as React from "react";
import { NotFoundRadarBackdrop } from "../NotFoundRadarBackdrop";
import styles from "./NotFoundHeroGraphic.module.css";

export const NotFoundHeroGraphic: React.FC = () => (
  <div className={styles.wrapper}>
    <NotFoundRadarBackdrop />
    <span className={styles.bracketLeft} aria-hidden="true">&lt;</span>
    <div className={styles.numberContainer}>
      <span className={styles.digit}>4</span>
      <span className={styles.digitCenter}>0</span>
      <span className={styles.digit}>4</span>
    </div>
    <span className={styles.bracketRight} aria-hidden="true">/&gt;</span>
  </div>
);
