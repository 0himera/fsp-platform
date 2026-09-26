import * as React from "react";
import { NotFoundGlitchBadge } from "../NotFoundGlitchBadge";
import { NotFoundHeroGraphic } from "../NotFoundHeroGraphic";
import { NotFoundConsole } from "../NotFoundConsole";
import { NotFoundActions } from "../NotFoundActions";
import styles from "./NotFoundView.module.css";

export const NotFoundView: React.FC = () => (
  <main className={styles.main}>
    <div className={styles.ambientBackground} aria-hidden="true" />
    <div className={styles.gridOverlay} aria-hidden="true" />
    <div className={styles.container}>
      <NotFoundGlitchBadge />
      <NotFoundHeroGraphic />
      <h1 className={styles.title}>Страница не найдена в реестре</h1>
      <p className={styles.description}>
        Запрашиваемый узел не существует или был архивирован. Проверьте правильность адреса или вернитесь к активным событиям Федерации.
      </p>
      <NotFoundConsole />
      <NotFoundActions />
    </div>
  </main>
);
