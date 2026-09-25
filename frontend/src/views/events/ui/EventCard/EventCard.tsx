import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, MapPin, Users } from "lucide-react";
import type { Competition } from "@/shared/api";
import { COMPETITION_LEVELS, COMPETITION_STAGES, COMPETITION_STATUSES } from "@/shared/config";
import { formatDate } from "@/shared/lib";
import { Button } from "@/shared/ui";
import styles from "./EventCard.module.css";

interface Props { event: Competition; discipline: string; registered: boolean; canRegister: boolean; registering: boolean; onRegister: () => void; }
function artwork(code: string) { return ["product", "security"].includes(code) ? "/media/slide-product.png" : ["robotics", "uav"].includes(code) ? "/media/slide-robotics.png" : "/media/slide-algorithmic.png"; }

export function EventCard({ event, discipline, registered, canRegister, registering, onRegister }: Props) {
  return (
    <article className={styles.card}>
      <Link href={`/competitions/${event.id}`} className={styles.art} aria-label={`Страница соревнования: ${event.title}`}>
        <Image src={artwork(event.discipline_code)} alt="" fill sizes="(max-width:760px) 100vw, 250px" />
        <span className={`${styles.status} ${styles[`status_${event.status}`]}`}>{COMPETITION_STATUSES[event.status] || event.status}</span>
      </Link>
      <div className={styles.body}>
        <div className={styles.topMeta}><span>{COMPETITION_LEVELS[event.level_code] || event.level_code}</span><span>{COMPETITION_STAGES[event.stage] || "Отдельный зачёт"}</span></div>
        <h2><Link href={`/competitions/${event.id}`}>{event.title}</Link></h2>
        {event.description && <p className={styles.description}>{event.description}</p>}
        <div className={styles.meta}><span><CalendarDays />{formatDate(event.starts_at)}</span><span><MapPin />{event.location || "Онлайн"}</span><span><Users />{event.registrations_count} заявок</span></div>
        <div className={styles.bottom}><span className={styles.discipline}>{discipline} · {event.format === "team" ? "Командный зачёт" : "Личный зачёт"}</span>{registered ? <span className={styles.registered}><Check />Заявка подана</span> : canRegister ? <Button size="sm" disabled={registering} onClick={onRegister}>{registering ? "Отправка…" : "Подать заявку"}</Button> : <Link href={`/competitions/${event.id}`} className={styles.details}>Подробнее <ArrowRight /></Link>}</div>
      </div>
    </article>
  );
}
