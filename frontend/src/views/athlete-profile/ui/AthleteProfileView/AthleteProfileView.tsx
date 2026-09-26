"use client";

import Link from "next/link";
import * as React from "react";
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
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const { data: competitions = [] } = useCompetitionsQuery();
  const { data: rankings } = useRankingsQuery();
  const { data: disciplines = [] } = useDisciplinesQuery();
  const names = new Map(disciplines.map((item) => [item.code, item.name]));
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (settingsOpen && !dialog.open) dialog.showModal();
    if (!settingsOpen && dialog.open) dialog.close();
  }, [settingsOpen]);

  return <main className={styles.page}><div className={styles.container}>
    <div className={styles.breadcrumb}><Link href="/rankings">Рейтинг</Link><span>/</span><span>{own ? "Мой профиль" : "Профиль спортсмена"}</span></div>
    <ProfileHero athlete={athlete} own={own} email={email} disciplines={names} onEdit={editor ? () => setSettingsOpen(true) : undefined} />
    {editor && <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="profile-settings-title" onClose={() => setSettingsOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
      <header className={styles.dialogHeader}><div><span>Личный кабинет</span><h2 id="profile-settings-title">Настройки профиля</h2></div><button type="button" className={styles.close} onClick={() => setSettingsOpen(false)} aria-label="Закрыть окно">×</button></header>
      <div className={styles.dialogBody}>{editor}</div>
    </dialog>}
    {rankEditor && <div className={styles.editors}>{rankEditor}</div>}
    <div className={styles.columns}><div className={styles.primary}><RatingMetrics athlete={athlete} /><AchievementSection results={athlete.results} items={athlete.achievements || []} own={own} selected={athlete.featured_achievement} /><ResultsHistory results={athlete.results} disciplines={names} />{own && <RegistrationList items={registrations} />}</div><ProfileSidebar nextEvent={upcoming(competitions)[0]} leaders={rankings?.athletes.slice(0,3) || []} /></div>
  </div></main>;
}
