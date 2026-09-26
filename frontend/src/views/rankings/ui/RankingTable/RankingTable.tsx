"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { Athlete } from "@/shared/api";
import { Input } from "@/shared/ui";
import { RankingRow } from "../RankingRow";
import styles from "./RankingTable.module.css";

interface Props { athletes: Athlete[]; ownId?: number; disciplines: Map<string, string>; loading: boolean; error: boolean; }

export function RankingTable({ athletes, ownId, disciplines, loading, error }: Props) {
  const [search, setSearch] = React.useState("");
  const query = search.trim().toLocaleLowerCase("ru-RU");
  const rows = athletes.filter((athlete) => [athlete.full_name, athlete.city, athlete.organization, ...athlete.disciplines.map((code) => disciplines.get(code) || code)].join(" ").toLocaleLowerCase("ru-RU").includes(query));
  return <section className={styles.section}>
    <div className={styles.heading}><div><span>Позиции и баллы</span><h2>Полный рейтинг</h2></div><label className={styles.search}><Search size={16} /><Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти спортсмена или город" /></label></div>
    {loading ? <p className={styles.empty}>Загружаем рейтинг…</p> : error ? <p className={styles.empty}>Не удалось загрузить рейтинг.</p> : rows.length ? <div className={styles.wrap}><table className={styles.table}><thead><tr><th>Место</th><th>Спортсмен</th><th>Город</th><th>Разряд</th><th>Результаты</th><th>Бонус</th><th>Итого</th></tr></thead><tbody>{rows.map((athlete) => <RankingRow key={athlete.id} athlete={athlete} ownId={ownId} disciplines={disciplines} />)}</tbody></table></div> : <p className={styles.empty}>Спортсмены не найдены.</p>}
    <p className={styles.count}>Показано {loading ? 0 : rows.length} из {athletes.length} спортсменов</p>
  </section>;
}
