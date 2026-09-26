import * as React from "react";
import styles from "./NotFoundGlitchBadge.module.css";

export const NotFoundGlitchBadge: React.FC = () => (
  <div className={styles.badge} role="status">
    <span className={styles.pulseDot} />
    <span className={styles.text}>ERR_404 :: ROUTE_NOT_RESOLVED</span>
  </div>
);
