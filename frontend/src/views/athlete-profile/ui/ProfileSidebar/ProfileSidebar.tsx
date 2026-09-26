import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Athlete, Competition } from "@/shared/api";
import { COMPETITION_STATUSES } from "@/shared/config";
import { formatDate, formatPoints } from "@/shared/lib";
import { AthleteAvatar } from "@/shared/ui";
import styles from "./ProfileSidebar.module.css";

export function ProfileSidebar({ nextEvent, leaders }: { nextEvent?: Competition; leaders: Athlete[] }) {
  return <aside className={styles.sidebar}>
    <section className={styles.next}><span>Следующий старт</span>{nextEvent ? <><i>{COMPETITION_STATUSES[nextEvent.status] || nextEvent.status}</i><h2>{nextEvent.title}</h2><p><CalendarDays />{formatDate(nextEvent.starts_at)}</p><p><MapPin />{nextEvent.location || "Онлайн"}</p><Link href={`/competitions/${nextEvent.id}`}>Страница соревнования <b>→</b></Link></> : <><h2>Новый старт пока не опубликован</h2><p>Следите за календарём Федерации.</p><Link href="/events">Открыть календарь <b>→</b></Link></>}</section>
    <section className={styles.top}><div className={styles.topHead}><h2>Топ-3 рейтинга</h2><Link href="/rankings">Весь рейтинг →</Link></div>{leaders.map((athlete) => <Link href={`/athletes/${athlete.id}`} className={styles.row} key={athlete.id}><b>{athlete.rating_place}</b><AthleteAvatar name={athlete.full_name} size="small" /><span><strong>{athlete.full_name}</strong><small>{athlete.city || "Дагестан"}</small></span><b>{formatPoints(athlete.rating)}</b></Link>)}</section>
    <section className={styles.note}><small>Внутренний рейтинг не заменяет официальные спортивные разряды.</small></section>
  </aside>;
}
