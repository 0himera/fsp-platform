import type { Athlete } from "@/shared/api";
import { formatPoints } from "@/shared/lib";
import styles from "./RatingMetrics.module.css";

export function RatingMetrics({ athlete }: { athlete: Athlete }) {
  return <section className={styles.metrics} aria-label="Состав рейтинга">
    <article><span>Баллы за результаты</span><strong>{formatPoints(athlete.result_points)}</strong><small>4 лучших результата</small></article>
    <article><span>Бонус разряда</span><strong>+{formatPoints(athlete.rank_points)}</strong><small>Активность {Math.round(athlete.activity_factor * 100)}%</small></article>
    <article><span>Всего стартов</span><strong>{athlete.results.length}</strong><small>Опубликованные протоколы</small></article>
  </section>;
}
