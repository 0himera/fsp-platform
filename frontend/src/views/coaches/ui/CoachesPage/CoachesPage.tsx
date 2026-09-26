"use client";

import * as React from "react";
import { useCoachesQuery } from "@/entities/staff";
import styles from "./CoachesPage.module.css";

const ROLE_LABEL: Record<string, string> = { coach: "Тренер", judge: "Судья" };

export function CoachesPage() {
  const { data: staff = [], isLoading } = useCoachesQuery();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.heading}>
          <div>
            <span>Федерация спортивного программирования РД</span>
            <h1>Тренеры и судьи</h1>
            <p>Специалисты, работающие со спортсменами и обеспечивающие проведение соревнований.</p>
          </div>
          <strong>{staff.length}<small>специалистов</small></strong>
        </header>

        {isLoading ? (
          <div className={styles.empty}>Загружаем список…</div>
        ) : staff.length === 0 ? (
          <div className={styles.empty}>Специалисты ещё не зарегистрированы на платформе.</div>
        ) : (
          <div className={styles.grid}>
            {staff.map((person) => (
              <div key={person.user_id} className={styles.card}>
                <div className={styles.avatar}>
                  {person.avatar_url ? (
                    <img src={person.avatar_url} alt="" />
                  ) : (
                    <span>{person.full_name.slice(0, 1).toLocaleUpperCase("ru-RU")}</span>
                  )}
                </div>
                <div className={styles.info}>
                  <div className={styles.name}>{person.full_name}</div>
                  <div className={styles.role}>{ROLE_LABEL[person.role] ?? person.role}</div>
                  {person.organization && <div className={styles.org}>{person.organization}</div>}
                  {person.city && <div className={styles.city}>{person.city}</div>}
                  {person.bio && <p className={styles.bio}>{person.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
