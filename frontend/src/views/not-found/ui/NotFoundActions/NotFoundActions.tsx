import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui";
import styles from "./NotFoundActions.module.css";

export const NotFoundActions: React.FC = () => (
  <div className={styles.actions}>
    <Link href="/" className={styles.link}>
      <Button className={styles.primaryBtn}>
        <span>Вернуться на главную</span>
        <span className={styles.arrow} aria-hidden="true">&rarr;</span>
      </Button>
    </Link>
    <Link href="/events" className={styles.link}>
      <Button variant="outline" className={styles.outlineBtn}>
        Календарь событий
      </Button>
    </Link>
    <Link href="/rankings" className={styles.link}>
      <Button variant="outline" className={styles.outlineBtn}>
        Рейтинг спортсменов
      </Button>
    </Link>
  </div>
);
