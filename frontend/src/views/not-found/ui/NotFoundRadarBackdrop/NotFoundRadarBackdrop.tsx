import * as React from "react";
import styles from "./NotFoundRadarBackdrop.module.css";

export const NotFoundRadarBackdrop: React.FC = () => (
  <div className={styles.container} aria-hidden="true">
    <div className={styles.glowAura} />
    <div className={styles.radarRing} />
    <div className={styles.radarRingOuter} />
  </div>
);
