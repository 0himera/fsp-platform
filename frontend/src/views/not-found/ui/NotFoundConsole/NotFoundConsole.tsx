import * as React from "react";
import styles from "./NotFoundConsole.module.css";

export const NotFoundConsole: React.FC = () => (
  <div className={styles.terminal}>
    <div className={styles.topBar}>
      <span className={styles.dotRed} />
      <span className={styles.dotYellow} />
      <span className={styles.dotGreen} />
      <span className={styles.terminalTitle}>bash · arena_resolver</span>
    </div>
    <div className={styles.codeBlock}>
      <p className={styles.line}>
        <span className={styles.prompt}>&gt;</span> trace_route(window.location.pathname)
      </p>
      <p className={styles.errorLine}>
        <span className={styles.errTag}>[FAIL]</span> 404: Node not found in registry graph
      </p>
      <p className={styles.line}>
        <span className={styles.prompt}>&gt;</span> resolve_action: redirect(&quot;/&quot;)
        <span className={styles.cursor}>_</span>
      </p>
    </div>
  </div>
);
