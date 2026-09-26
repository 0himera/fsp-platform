"use client";

import * as React from "react";
import { useCompetitionsQuery } from "@/entities/competition";
import { useRankingsQuery } from "@/entities/ranking";
import { HomeHighlights } from "../HomeHighlights";
import { HomeStage } from "../HomeStage";
import styles from "./HomePage.module.css";

export const HomePage: React.FC = () => {
  const { data: competitions = [], isLoading } = useCompetitionsQuery();
  const { data: rankings } = useRankingsQuery();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const events = React.useMemo(() => [...competitions].filter((item) => item.status !== "draft").sort((a, b) => {
    const activeA = a.status === "completed" ? 1 : 0;
    const activeB = b.status === "completed" ? 1 : 0;
    return activeA - activeB || (activeA ? new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime() : new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }), [competitions]);
  const slides = events.slice(0, 5);
  React.useEffect(() => { setIndex(0); }, [slides.length]);
  React.useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [index, paused, slides.length]);
  const activeEvents = events.filter((item) => item.status === "open" || item.status === "running").length;

  return <main className={styles.page} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <HomeStage events={events} slides={slides} index={index} loading={isLoading} onSelect={setIndex} />
    <HomeHighlights activeEvents={activeEvents} athletes={rankings?.athletes.length || 0} />
  </main>;
};

export default HomePage;
