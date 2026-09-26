"use client";

import * as React from "react";
import { useRankingsQuery } from "@/entities/ranking";
import { RankingHeader } from "./ui/RankingHeader";
import { RankingTable } from "./ui/RankingTable";
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
      <RankingHeader search={search} onSearchChange={setSearch} />
      {isLoading ? (
        <div className={styles.loading}>Загрузка таблицы рейтинга...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Спортсмены не найдены</div>
      ) : (
        <RankingTable athletes={filtered} />
      )}
    </section>
  );
};
