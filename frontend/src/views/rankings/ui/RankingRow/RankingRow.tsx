import Link from "next/link";
import type { Athlete } from "@/shared/api";
import { SPORT_RANKS_MAP } from "@/shared/config";
import { formatPoints } from "@/shared/lib";
import { AthleteAvatar } from "@/shared/ui";
import styles from "./RankingRow.module.css";

export function RankingRow({ athlete, ownId, disciplines }: { athlete: Athlete; ownId?: number; disciplines: Map<string, string> }) {
  const names = athlete.disciplines.map((code) => disciplines.get(code) || code).join(" · ");
  return <tr className={athlete.id === ownId ? styles.own : ""}>
    <td><span className={athlete.rating_place <= 3 ? styles.topPlace : styles.place}>{athlete.rating_place}</span></td>
    <td><Link href={`/athletes/${athlete.id}`} className={styles.identity}><AthleteAvatar name={athlete.full_name} size="small" src={athlete.avatar_url} /><span><strong>{athlete.full_name}</strong><small>{athlete.featured_achievement?.title || names}</small></span></Link></td>
    <td className={styles.city}>{athlete.city || athlete.organization || "—"}</td>
    <td><span className={styles.rank}>{SPORT_RANKS_MAP[athlete.rank_code] || athlete.rank_code || "Без разряда"}</span></td>
    <td className={styles.number}>{formatPoints(athlete.result_points)}</td><td className={styles.number}>{formatPoints(athlete.rank_points)}</td><td className={`${styles.number} ${styles.total}`}>{formatPoints(athlete.rating)}</td>
  </tr>;
}
