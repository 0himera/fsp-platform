"use client";

import * as React from "react";
import { useCompetitionsQuery, useMyRegistrationsQuery } from "@/entities/competition";
import { useRegisterCompetitionMutation } from "@/features/register-competition";
import { useMeQuery } from "@/entities/user";
import { useDisciplinesQuery } from "@/entities/discipline";
import { EventFilterBar } from "../EventFilterBar";
import { EventCard } from "../EventCard";
import styles from "./EventsPage.module.css";

type Filter = "all" | "active" | "completed";
function compareEvents(a: { status: string; starts_at: string }, b: { status: string; starts_at: string }) {
  const completed = a.status === "completed";
  if (completed !== (b.status === "completed")) return completed ? 1 : -1;
  const difference = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  return completed ? -difference : difference;
}

export function EventsPage() {
  const { data: competitions = [], isLoading } = useCompetitionsQuery();
  const { data: me } = useMeQuery();
  const { data: registrations = [] } = useMyRegistrationsQuery();
  const { data: disciplines = [] } = useDisciplinesQuery();
  const register = useRegisterCompetitionMutation();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");
  const [discipline, setDiscipline] = React.useState("all");
  const [level, setLevel] = React.useState("all");
  
  const names = React.useMemo(() => new Map(disciplines.map((item) => [item.code, item.name])), [disciplines]);
  const registered = React.useMemo(() => new Set(registrations.map((item) => item.id)), [registrations]);
  const query = search.trim().toLocaleLowerCase("ru-RU");
  
  const events = competitions.filter((event) => event.status !== "draft")
    .filter((event) => filter === "all" || (filter === "active" ? event.status !== "completed" : event.status === "completed"))
    .filter((event) => discipline === "all" || event.discipline_code === discipline)
    .filter((event) => level === "all" || event.level_code === level)
    .filter((event) => !query || [event.title, event.location, names.get(event.discipline_code)].filter(Boolean).join(" ").toLocaleLowerCase("ru-RU").includes(query))
    .slice().sort(compareEvents);

  return (
    <main className={styles.page}><div className={styles.container}>
      <header className={styles.heading}><div><span>Календарь Федерации</span><h1>События и соревнования</h1><p>Официальные старты, заявки и опубликованные результаты спортсменов Дагестана.</p></div><strong>{competitions.filter((item) => item.status === "open" || item.status === "running").length}<small>активных события</small></strong></header>
      <EventFilterBar
        filter={filter}
        search={search}
        discipline={discipline}
        level={level}
        disciplines={disciplines}
        onFilter={setFilter}
        onSearch={setSearch}
        onDiscipline={setDiscipline}
        onLevel={setLevel}
      />
      {isLoading ? <div className={styles.empty}>Загружаем календарь…</div> : events.length ? <div className={styles.list}>{events.map((event) => <EventCard key={event.id} event={event} discipline={names.get(event.discipline_code) || event.discipline_code} registered={registered.has(event.id)} canRegister={me?.user?.role === "athlete" && event.registration_open && !registered.has(event.id)} registering={register.isPending} onRegister={() => register.mutate(event.id)} />)}</div> : <div className={styles.empty}>По выбранным условиям события не найдены.</div>}
    </div></main>
  );
}
