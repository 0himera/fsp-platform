import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import type { Competition } from "@/shared/api";
import { COMPETITION_STATUSES } from "@/shared/config";
import { formatDate } from "@/shared/lib";
import { CarouselControls } from "../CarouselControls";
import styles from "./FeaturedEvent.module.css";

interface Props { slides: Competition[]; loading: boolean; index: number; onSelect: (index: number) => void; }
function artwork(code: string) { return ["product", "security"].includes(code) ? "/media/slide-product.png" : ["robotics", "uav"].includes(code) ? "/media/slide-robotics.png" : "/media/slide-algorithmic.png"; }

export function FeaturedEvent({ slides, loading, index, onSelect }: Props) {
  if (!slides.length) {
    return <div className={styles.empty}><Trophy size={30} /><strong>{loading ? "Загружаем календарь…" : "События скоро появятся"}</strong><span>Следите за календарём Федерации.</span></div>;
  }
  return <>
    <article className={styles.feature}>
      <div className={styles.artViewport}>
        {slides.map((event, i) => <Link key={event.id} href={`/competitions/${event.id}`} className={`${styles.artSlide} ${i === index ? styles.artSlideActive : ""}`} tabIndex={i === index ? 0 : -1} aria-hidden={i !== index} aria-label={`Открыть ${event.title}`}>
          <Image src={artwork(event.discipline_code)} alt="" fill priority={i === 0} sizes="(max-width:900px) 100vw, 62vw" className={styles.artImage} />
          <span className={styles.status}>{COMPETITION_STATUSES[event.status] || event.status}</span><span className={styles.discipline}>{event.discipline_code.replaceAll("_", " ")}</span>
        </Link>)}
      </div>
      <div className={styles.captionViewport}>
        {slides.map((event, i) => <div key={event.id} className={`${styles.captionSlide} ${i === index ? styles.captionSlideActive : ""}`} aria-hidden={i !== index}>
          <div><span>Ближайшее событие</span><h2><Link href={`/competitions/${event.id}`}>{event.title}</Link></h2></div>
          <div className={styles.bottom}><span><CalendarDays size={16} />{formatDate(event.starts_at, { year: undefined })}</span><Link href={`/competitions/${event.id}`}>Открыть событие <ArrowRight size={18} /></Link></div>
        </div>)}
      </div>
    </article>
    <CarouselControls count={slides.length} index={index} onSelect={onSelect} />
  </>;
}
