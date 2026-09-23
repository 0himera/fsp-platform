"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from "@/shared/ui";
import { useCompetitionsQuery, useRegisterCompetitionMutation, useMyRegistrationsQuery } from "@/entities/competition";
import { useMeQuery } from "@/entities/user";
import { COMPETITION_LEVELS, COMPETITION_STATUSES } from "@/shared/config";
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

      <div className={styles.header}>
        <h2 className={styles.heading}>Соревнования Республики Дагестан</h2>
        <p className={styles.description}>
          Официальные старты, этапы отбора и итоговые турниры
        </p>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Загрузка соревнований...</div>
      ) : openCompetitions.length === 0 ? (
        <div className={styles.empty}>Соревнований пока нет</div>
      ) : (
        <div className={styles.grid}>
          {openCompetitions.slice(0, 6).map((c) => {
            const isRegistered = registeredIds.has(c.id);
            const canRegister = isAthlete && c.registration_open && !isRegistered;

            return (
              <Card key={c.id} className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                  <div className={styles.badges}>
                    <Badge variant={c.status === "open" ? "default" : "secondary"}>
                      {COMPETITION_STATUSES[c.status] || c.status}
                    </Badge>
                    <span className={styles.level}>
                      {COMPETITION_LEVELS[c.level_code] || c.level_code}
                    </span>
                  </div>
                  <CardTitle className={styles.cardTitle}>
                    <a href={`/competitions/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {c.title}
                    </a>
                  </CardTitle>
                  <CardDescription className={styles.cardMeta}>
                    {new Date(c.starts_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · {c.location || "Онлайн"} · {c.registrations_count} заявок
                  </CardDescription>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                  <p className={styles.cardDesc}>
                    {c.description ? c.description.slice(0, 140) + "…" : "Регламент опубликован."}
                  </p>
                  <div className={styles.actions} style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "space-between" }}>
                    <a href={`/competitions/${c.id}`}>
                      <Button variant="outline" size="sm">
                        Подробнее
                      </Button>
                    </a>
                    {isRegistered ? (
                      <span className={styles.registeredBadge}>✓ Заявка подана</span>
                    ) : canRegister ? (
                      <Button
                        size="sm"
                        disabled={registerMutation.isPending}
                        onClick={() => registerMutation.mutate(c.id)}
                      >
                        {registerMutation.isPending ? "Отправка..." : "Подать заявку"}
                      </Button>
                    ) : (
                      <span className={styles.formatInfo}>
                        {c.format === "team" ? "Командный" : "Одиночный"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CompetitionsSection;
