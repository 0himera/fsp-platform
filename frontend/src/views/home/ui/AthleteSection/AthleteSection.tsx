"use client";

import * as React from "react";
import { UserCard, useAthleteProfile, useMeQuery } from "@/entities/user";
import styles from "./AthleteSection.module.css";


export const AthleteSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const { data: athlete, isLoading } = useAthleteProfile();

  const isOwnProfile = Boolean(me?.athlete);

  return (
    <section className={styles.section}>
      <div>
        <h2 className={styles.heading}>
          {isOwnProfile ? "Ваш профиль спортсмена" : "Лидер рейтинга Дагестана (Топ-1)"}
        </h2>
        <p className={styles.description}>
          {isOwnProfile
            ? "Ваши актуальные баллы, разряд и история участия в соревнованиях"
            : "Актуальные баллы из единой базы Федерации спортивного программирования РД"}
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

export default AthleteSection;
