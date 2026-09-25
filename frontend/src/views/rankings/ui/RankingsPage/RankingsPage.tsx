"use client";

import * as React from "react";
import { useRankingsQuery } from "@/entities/ranking";
import { useMeQuery } from "@/entities/user";
import { useDisciplinesQuery } from "@/entities/discipline";
import { formatDate } from "@/shared/lib";
import { Podium } from "../Podium";
import { RankingTable } from "../RankingTable";
import { RankingAside } from "../RankingAside";
import styles from "./RankingsPage.module.css";

export function RankingsPage() {
  const { data, isLoading, error } = useRankingsQuery();
  const { data: me } = useMeQuery();
  const { data: disciplines = [] } = useDisciplinesQuery();
  const athletes = data?.athletes || [];
  const names = React.useMemo(() => new Map(disciplines.map((item) => [item.code, item.name])), [disciplines]);
  return <main className={styles.page}>
    <header className={styles.heading}><div><span>Сезон 2026 · Республика Дагестан</span><h1>Рейтинг спортсменов</h1><p>Текущие позиции рассчитаны по опубликованным протоколам и подтверждённым спортивным разрядам.</p></div>{data?.as_of && <time dateTime={data.as_of}>Обновлено {formatDate(data.as_of)}</time>}</header>
    <div className={styles.layout}><div className={styles.main}><Podium athletes={athletes} /><RankingTable athletes={athletes} ownId={me?.athlete?.id} disciplines={names} loading={isLoading} error={Boolean(error)} /></div><RankingAside /></div>
  </main>;
}
