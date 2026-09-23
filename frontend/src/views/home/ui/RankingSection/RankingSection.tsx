"use client";

import * as React from "react";
import { Card, CardContent, Input, Badge } from "@/shared/ui";

import { useRankingsQuery } from "@/entities/ranking";
import { SPORT_RANKS_MAP } from "@/shared/config";
import styles from "./RankingSection.module.css";

export const RankingSection: React.FC = () => {
  const { data: rankings, isLoading } = useRankingsQuery();
  const [search, setSearch] = React.useState("");

  const athletes = rankings?.athletes || [];
  const filtered = search.trim()
    ? athletes.filter((a) =>
        (a.full_name + " " + a.city + " " + a.organization)
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      )
    : athletes;

  return (
    <section id="ratings" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.heading}>Рейтинг спортсменов Республики Дагестан</h2>
          <p className={styles.description}>
            Единый официальный рейтинг Федерации спортивного программирования РД. Модель arena-2 учитывает
            4 лучших старта, уровень турнира, занятое место, масштаб сетки и подтверждённый разряд.
          </p>
        </div>
        <div className={styles.toolbar}>
          <Input
            placeholder="Поиск по спортсмену, городу или вузу..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Загрузка таблицы рейтинга...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Спортсмены не найдены</div>
      ) : (
        <Card className={styles.tableCard}>
          <CardContent className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>№</th>
                  <th>Спортсмен</th>
                  <th>Город / Организация</th>
                  <th>Разряд</th>
                  <th className={styles.numberCol}>Турниры</th>
                  <th className={styles.numberCol}>Разряд</th>
                  <th className={styles.numberCol}>Итого</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className={a.rating_place <= 3 ? styles.topPlace : styles.place}>
                        {a.rating_place}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`/athletes/${a.id}`}
                        className={styles.athleteName}
                        style={{ textDecoration: "none", color: "inherit", display: "inline-block" }}
                      >
                        {a.full_name}
                      </a>
                      {a.disciplines && a.disciplines.length > 0 && (
                        <div className={styles.disciplines}>
                          {a.disciplines.join(", ")}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.metaText}>
                        {[a.city, a.organization].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline">
                        {SPORT_RANKS_MAP[a.rank_code] || a.rank_code || "Без разряда"}
                      </Badge>
                    </td>
                    <td className={styles.numberCol}>
                      {a.result_points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                    </td>
                    <td className={styles.numberCol}>
                      +{a.rank_points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                    </td>
                    <td className={`${styles.numberCol} ${styles.totalCol}`}>
                      {a.rating.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <details className={styles.details}>
        <summary className={styles.summary}>Как устроен расчёт рейтинга arena-2</summary>
        <div className={styles.detailsBody}>
          <p>
            <strong>Формула:</strong> Рейтинг = сумма 4 лучших результатов турниров + бонус за высший
            подтверждённый разряд с учётом активности.
          </p>
          <p>
            Баллы за турнир рассчитываются с учётом ранга турнира (Чемпионат РФ — 1000, Всероссийские — 650,
            Межрегиональные — 400, Чемпионат Дагестана — 250, Региональные — 120), места в протоколе,
            масштаба сетки финишировавших и плавного спада давности за 3 года.
          </p>
        </div>
      </details>
    </section>
  );
};

export default RankingSection;
