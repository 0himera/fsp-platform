import { Award, CalendarDays, CircleCheck, Medal, Trophy } from "lucide-react";
import type { AthleteResult } from "@/shared/api";
import { formatDate } from "@/shared/lib";
import { buildAchievements, type AchievementKind } from "../../model/achievements";
import styles from "./AchievementSection.module.css";

function Icon({ kind }: { kind: AchievementKind }) {
  if (kind === "win") return <Trophy />;
  if (kind === "podium") return <Medal />;
  if (kind === "final") return <Award />;
  if (kind === "series") return <CircleCheck />;
  return <CalendarDays />;
}

export function AchievementSection({ results }: { results: AthleteResult[] }) {
  const achievements = buildAchievements(results);
  return <section className={styles.section}>
    <header><div><span>Прогресс по протоколам</span><h2>Достижения</h2></div><small>Подтверждено результатами</small></header>
    {achievements.length ? <div className={styles.grid}>{achievements.map((item) => <article key={`${item.kind}-${item.title}`}>
      <span className={`${styles.icon} ${styles[item.kind]}`}><Icon kind={item.kind} /></span><span><strong>{item.title}</strong><small>{item.description}</small>{item.date && <time dateTime={item.date}>Получено {formatDate(item.date)}</time>}</span>
    </article>)}</div> : <p className={styles.empty}>Достижения появятся после публикации первого протокола.</p>}
  </section>;
}
