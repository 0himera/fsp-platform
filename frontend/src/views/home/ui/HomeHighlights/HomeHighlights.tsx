import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import styles from "./HomeHighlights.module.css";

export function HomeHighlights({ activeEvents, athletes }: { activeEvents: number; athletes: number }) {
  return <section className={styles.highlights} aria-label="Разделы платформы">
    <Link href="/events"><span><CalendarDays /></span><span><small>Календарь</small><strong>{activeEvents} активных события</strong></span><ArrowRight /></Link>
    <Link href="/rankings"><span><Trophy /></span><span><small>Рейтинг</small><strong>{athletes} спортсменов</strong></span><ArrowRight /></Link>
  </section>;
}
