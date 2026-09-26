"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Competition } from "@/shared/api";
import { formatDate } from "@/shared/lib";
import styles from "./UpcomingEvents.module.css";

interface Props { events: Competition[]; selectedId?: number; onSelect: (id: number) => void; }

export function UpcomingEvents({ events, selectedId, onSelect }: Props) {
  const router = useRouter();
  const selectOrOpen = (id: number) => {
    if (selectedId === id) router.push(`/competitions/${id}`);
    else onSelect(id);
  };

  return <aside className={styles.panel}>
    <div className={styles.heading}><div><span>Календарь</span><h2>События</h2></div><strong>{String(events.length).padStart(2, "0")}</strong></div>
    <p className={styles.subheading}>Ближайшие соревнования</p>
    <div className={styles.list}>{events.map((event, index) => (
      <div key={event.id} role="button" tabIndex={0} className={`${styles.row} ${selectedId === event.id ? styles.active : ""}`} aria-pressed={selectedId === event.id} onClick={() => selectOrOpen(event.id)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectOrOpen(event.id); } }}>
        <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.content}><strong>{event.title}</strong><small><CalendarDays />{formatDate(event.starts_at, { year: undefined })}<i>·</i><MapPin />{event.location || "Онлайн"}</small></span>
        <Link href={`/competitions/${event.id}`} className={styles.arrowLink} aria-label={`Перейти к соревнованию ${event.title}`} onClick={(e) => e.stopPropagation()}>
          <ArrowRight className={styles.arrow} />
        </Link>
      </div>
    ))}{!events.length && <p className={styles.empty}>Пока нет опубликованных соревнований.</p>}</div>
    <Link href="/events" className={styles.all}>Все события <ArrowRight size={17} /></Link>
    <span className={styles.footnote}>Региональные старты · Дагестан</span>
  </aside>;
}
