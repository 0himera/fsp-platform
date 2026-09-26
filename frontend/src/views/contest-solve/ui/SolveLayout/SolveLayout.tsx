"use client";

import * as React from "react";
import styles from "./SolveLayout.module.css";

interface Props {
  header: React.ReactNode;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  modal?: React.ReactNode;
}

export function SolveLayout({ header, leftPane, rightPane, modal }: Props) {
  return (
    <div className={styles.page}>
      {header}
      <main className={styles.main}>
        {leftPane}
        {rightPane}
      </main>
      {modal}
    </div>
  );
}
