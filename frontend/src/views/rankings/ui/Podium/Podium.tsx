import Link from "next/link";
import { Medal } from "lucide-react";
import type { Athlete } from "@/shared/api";
import { SPORT_RANKS_MAP } from "@/shared/config";
import { formatPoints } from "@/shared/lib";
import { AthleteAvatar } from "@/shared/ui";
import styles from "./Podium.module.css";

export function Podium({ athletes }: { athletes: Athlete[] }) {
  const positions = [styles.first, styles.second, styles.third];
  return <section className={styles.podium} aria-label="Три лидера рейтинга">
    {athletes.slice(0, 3).map((athlete, index) => <article className={`${styles.card} ${positions[index]}`} key={athlete.id}>
      <span className={styles.place}><Medal size={25} strokeWidth={1.5} /><strong>{athlete.rating_place}</strong></span>
      <Link href={`/athletes/${athlete.id}`} className={styles.identity}><AthleteAvatar name={athlete.full_name} src={athlete.avatar_url} /><span><strong>{athlete.full_name}</strong><small>{athlete.city || athlete.organization || "Республика Дагестан"}</small></span></Link>
      <div className={styles.score}><span>Рейтинг</span><strong>{formatPoints(athlete.rating)}</strong></div>
      <div className={styles.rank}><span>Спортивный разряд</span><strong>{SPORT_RANKS_MAP[athlete.rank_code] || athlete.rank_code || "Без разряда"}</strong></div>
    </article>)}
  </section>;
}
