"use client";

import * as React from "react";
import { LoginForm } from "@/features/auth-by-email";
import styles from "./AuthSection.module.css";

export const AuthSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <div>
        <h2 className={styles.heading}>Авторизация в системе</h2>
        <p className={styles.description}>
          Быстрый вход для спортсменов сборной и организаторов соревнований
        </p>
      </div>
      <LoginForm />
    </section>
  );
};
