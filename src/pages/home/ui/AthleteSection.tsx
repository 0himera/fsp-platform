"use client";

import * as React from "react";
import { UserCard, useAthleteProfile } from "@/entities/user";
import styles from "./AthleteSection.module.css";

export const AthleteSection: React.FC = () => {
  const { data: athlete, isLoading } = useAthleteProfile();

  return (
    <section className={styles.section}>
      <div>
        <h2 className={styles.heading}>Профиль спортсмена (Демо)</h2>
        <p className={styles.description}>
          Карточка спортсмена с привязкой разряда, дисциплины и баллов рейтинга
        </p>
      </div>

      {isLoading || !athlete ? (
        <div className={styles.loading}>Загрузка данных спортсмена...</div>
      ) : (
        <UserCard athlete={athlete} />
      )}
    </section>
  );
};
