"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Athlete, Competition } from "@/shared/api";
import { useCompetitionsQuery } from "@/entities/competition";
import { useRankingsQuery } from "@/entities/ranking";
import { useDisciplinesQuery } from "@/entities/discipline";
import { ProfileHero } from "../ProfileHero";
import { RatingMetrics } from "../RatingMetrics";
import { AchievementSection } from "../AchievementSection";
import { ResultsHistory } from "../ResultsHistory";
import { RegistrationList } from "../RegistrationList";
import { ProfileSidebar } from "../ProfileSidebar";
import styles from "./AthleteProfileView.module.css";

interface Props { athlete: Athlete; own?: boolean; email?: string; editor?: ReactNode; rankEditor?: ReactNode; registrations?: Competition[]; }
function upcoming(items: Competition[]) { return items.filter((item) => (item.status === "open" || item.status === "running") && (new Date(item.ends_at).getTime() >= Date.now() || item.status === "running")).slice().sort((a,b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()); }

export function AthleteProfileView({ athlete, own = false, email, editor, rankEditor, registrations = [] }: Props) {
  const { data: competitions = [] } = useCompetitionsQuery();
  const { data: rankings } = useRankingsQuery();
  const { data: disciplines = [] } = useDisciplinesQuery();
  const names = new Map(disciplines.map((item) => [item.code, item.name]));
  return <main className={styles.page}><div className={styles.container}>
    <div className={styles.breadcrumb}><Link href="/rankings">Рейтинг</Link><span>/</span><span>{own ? "Мой профиль" : "Профиль спортсмена"}</span></div>
    <ProfileHero athlete={athlete} own={own} email={email} disciplines={names} />
    {(editor || rankEditor) && <div className={styles.editors}>{editor}{rankEditor}</div>}
    <div className={styles.columns}><div className={styles.primary}><RatingMetrics athlete={athlete} /><AchievementSection results={athlete.results} items={athlete.achievements || []} own={own} selected={athlete.featured_achievement} /><ResultsHistory results={athlete.results} disciplines={names} />{own && <RegistrationList items={registrations} />}</div><ProfileSidebar nextEvent={upcoming(competitions)[0]} leaders={rankings?.athletes.slice(0,3) || []} own={own} /></div>
  </div></main>;
}
