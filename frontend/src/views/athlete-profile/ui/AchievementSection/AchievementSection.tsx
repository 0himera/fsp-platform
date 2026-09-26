import { Award, CalendarDays, CircleCheck, Medal, Trophy } from "lucide-react";
import type { AthleteResult } from "@/shared/api";
import type { Achievement } from "@/shared/api";
import { useFeaturedAchievementMutation } from "@/features/update-profile";
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

export function AchievementSection({ results, items, own, selected }: { results: AthleteResult[]; items: Achievement[]; own: boolean; selected?: Achievement | null }) {
  const fallback = buildAchievements(results);
  const achievements = items.length ? items : fallback.map((item, index) => ({ code: `legacy-${index}`, title: item.title, description: item.description, kind: item.kind, date: item.date || "" }));
  const mutation = useFeaturedAchievementMutation();
  return <section className={styles.section}>
    <header><div><span>Прогресс по протоколам</span><h2>Достижения</h2></div><small>Подтверждено результатами</small></header>
    {own && <label className={styles.featured}>Ключевое достижение<select value={selected?.code || ""} disabled={mutation.isPending} onChange={(event) => mutation.mutate(event.target.value || null)}><option value="">Не выбрано</option>{achievements.map((item) => <option key={item.code} value={item.code}>{item.title} · {item.description}</option>)}</select></label>}
    {achievements.length ? <div className={styles.grid}>{achievements.map((item) => <article key={item.code} data-featured={selected?.code === item.code}>
      <span className={`${styles.icon} ${styles[item.kind]}`}><Icon kind={item.kind} /></span><span><strong>{item.title}{selected?.code === item.code && <em> · Ключевое</em>}</strong><small>{item.description}</small>{item.date && <time dateTime={item.date}>Получено {formatDate(item.date)}</time>}</span>
    </article>)}</div> : <p className={styles.empty}>Достижения появятся после публикации первого протокола.</p>}
  </section>;
}
