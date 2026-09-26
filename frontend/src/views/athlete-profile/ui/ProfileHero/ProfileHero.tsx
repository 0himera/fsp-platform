import { MapPin } from "lucide-react";
import type { Athlete } from "@/shared/api";
import { SPORT_RANKS_MAP } from "@/shared/config";
import { formatPoints } from "@/shared/lib";
import { AthleteAvatar } from "@/shared/ui";
import styles from "./ProfileHero.module.css";

export function ProfileHero({ athlete, own, email, disciplines }: { athlete: Athlete; own: boolean; email?: string; disciplines: Map<string, string> }) {
  const rank = SPORT_RANKS_MAP[athlete.rank_code] || athlete.rank_code || "Без разряда";
  return <section className={styles.hero}>
    <div className={styles.identity}><AthleteAvatar name={athlete.full_name} size="large" src={athlete.avatar_url} /><div><span>{own ? "Личный кабинет спортсмена" : "Спортсмен · ФСП РД"}</span><h1>{athlete.full_name}</h1><p><MapPin size={16} />{athlete.city || "Республика Дагестан"}{athlete.organization && <> · {athlete.organization}</>}</p>{email && <small>{email}</small>}<div className={styles.disciplines}>{athlete.disciplines.length ? athlete.disciplines.map((code) => <i key={code}>{disciplines.get(code) || code}</i>) : <i>Дисциплины не указаны</i>}</div></div></div>
    <div className={styles.stats}><div className={styles.rank}><b>{athlete.rank_code === "none" ? "—" : athlete.rank_code}</b><span><small>Спортивный разряд</small><strong>{rank}</strong></span></div><div><small>Место в рейтинге</small><strong>№ {athlete.rating_place}</strong></div><div className={styles.total}><small>Рейтинг Арены</small><strong>{formatPoints(athlete.rating)}</strong><small>баллов</small></div></div>
  </section>;
}
