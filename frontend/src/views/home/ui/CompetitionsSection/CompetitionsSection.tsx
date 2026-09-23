"use client";

import * as React from "react";
import { useCompetitionsQuery, useMyRegistrationsQuery } from "@/entities/competition";
import { useRegisterCompetitionMutation } from "@/features/register-competition";
import { useMeQuery } from "@/entities/user";
import { CompetitionsHeader } from "./ui/CompetitionsHeader";
import { CompetitionItem } from "./ui/CompetitionItem";
import styles from "./CompetitionsSection.module.css";

export const CompetitionsSection: React.FC = () => {
  const { data: competitions, isLoading } = useCompetitionsQuery();
  const { data: me } = useMeQuery();
  const { data: myRegistrations } = useMyRegistrationsQuery();
  const registerMutation = useRegisterCompetitionMutation();

  const isAthlete = me?.user.role === "athlete";
  const registeredIds = new Set(myRegistrations?.map((c) => c.id) || []);
  const openCompetitions = competitions?.filter((c) => c.status !== "draft") || [];

  return (
    <section id="competitions" className={styles.section}>
      <CompetitionsHeader />
      {isLoading ? (
        <div className={styles.loading}>Загрузка соревнований...</div>
      ) : openCompetitions.length === 0 ? (
        <div className={styles.empty}>Соревнований пока нет</div>
      ) : (
        <div className={styles.grid}>
          {openCompetitions.slice(0, 6).map((c) => (
            <CompetitionItem
              key={c.id}
              competition={c}
              isRegistered={registeredIds.has(c.id)}
              canRegister={isAthlete && c.registration_open && !registeredIds.has(c.id)}
              onRegister={(id) => registerMutation.mutate(id)}
              isRegistering={registerMutation.isPending}
            />
          ))}
        </div>
      )}
    </section>
  );
};
