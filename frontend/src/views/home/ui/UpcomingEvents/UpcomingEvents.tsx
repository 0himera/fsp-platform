"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Competition } from "@/shared/api";
import { UpcomingEventRow } from "./ui/UpcomingEventRow";
import styles from "./UpcomingEvents.module.css";

interface Props {
  events: Competition[];
  selectedId?: number;
  onSelect: (id: number) => void;
}

export function UpcomingEvents({ events, selectedId, onSelect }: Props) {
  const router = useRouter();

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <div><span>Календарь</span><h2>События</h2></div>
        <strong>{String(events.length).padStart(2, "0")}</strong>
      </div>
      <p className={styles.subheading}>Ближайшие соревнования</p>
      <div className={styles.list}>
        {events.map((event, index) => (
          <UpcomingEventRow
            key={event.id}
            event={event}
            index={index}
            isActive={selectedId === event.id}
            onSelect={() => onSelect(event.id)}
            onOpen={() => router.push(`/competitions/${event.id}`)}
          />
        ))}
        {!events.length && <p className={styles.empty}>Пока нет опубликованных соревнований.</p>}
      </div>
      <Link href="/events" className={styles.all}>Все события <ArrowRight size={17} /></Link>
      <span className={styles.footnote}>Региональные старты · Дагестан</span>
    </aside>
  );
}
