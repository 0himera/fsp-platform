import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import type { Competition } from "@/shared/api";
import { COMPETITION_STATUSES } from "@/shared/config";
import { formatDate } from "@/shared/lib";
import { CarouselControls } from "../CarouselControls";
import styles from "./FeaturedEvent.module.css";

interface Props { event?: Competition; discipline: string; loading: boolean; count: number; index: number; onSelect: (index: number) => void; }
function artwork(code: string) { return ["product", "security"].includes(code) ? "/media/slide-product.png" : ["robotics", "uav"].includes(code) ? "/media/slide-robotics.png" : "/media/slide-algorithmic.png"; }

export function FeaturedEvent({ event, discipline, loading, count, index, onSelect }: Props) {
  return <>
    {event ? <article key={event.id} className={styles.feature}>
      <Link href={`/competitions/${event.id}`} className={styles.art} aria-label={`Открыть ${event.title}`}>
        <Image key={`img-${event.id}`} src={artwork(event.discipline_code)} alt="" fill priority sizes="(max-width:900px) 100vw, 62vw" className={styles.artImage} />
        <span className={styles.status}>{COMPETITION_STATUSES[event.status] || event.status}</span><span className={styles.discipline}>{discipline}</span>
      </Link>
      <div className={styles.caption}><div><span className={styles.captionTag}>Ближайшее событие</span><h2 className={styles.captionTitle}><Link href={`/competitions/${event.id}`}>{event.title}</Link></h2></div><div className={styles.bottom}><span><CalendarDays size={16} />{formatDate(event.starts_at, { year: undefined })}</span><Link href={`/competitions/${event.id}`}>Открыть событие <ArrowRight size={18} /></Link></div></div>
    </article> : <div className={styles.empty}><Trophy size={30} /><strong>{loading ? "Загружаем календарь…" : "События скоро появятся"}</strong><span>Следите за календарём Федерации.</span></div>}
    <CarouselControls count={count} index={index} onSelect={onSelect} />
  </>;
}
