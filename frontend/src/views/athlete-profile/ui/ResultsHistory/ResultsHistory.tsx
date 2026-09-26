import Link from "next/link";
import type { AthleteResult } from "@/shared/api";
import { COMPETITION_LEVELS, COMPETITION_STAGES } from "@/shared/config";
import { formatDate, formatPoints } from "@/shared/lib";
import styles from "./ResultsHistory.module.css";

export function ResultsHistory({ results, disciplines }: { results: AthleteResult[]; disciplines: Map<string, string> }) {
  const history = [...results].sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
  return <section className={styles.section}>
    <header><div><span>Опубликованные протоколы</span><h2>История соревнований</h2></div><small>{history.length} результатов</small></header>
    {history.length ? <div className={styles.wrap}><table><thead><tr><th>Дата</th><th>Соревнование</th><th>Этап / дисциплина</th><th>Результат</th><th>Баллы</th></tr></thead><tbody>{history.map((result) => <tr key={`${result.competition_id}-${result.stage}`}>
      <td className={styles.date}>{formatDate(result.ends_at,{year:undefined})}</td><td><Link href={`/competitions/${result.competition_id}`}>{result.competition}</Link><small>{COMPETITION_LEVELS[result.level] || result.level}</small></td><td>{COMPETITION_STAGES[result.stage] || result.stage}<small>{disciplines.get(result.discipline) || result.discipline}</small></td><td><strong>{result.place} место</strong><small>{result.finishers} участников</small></td><td><strong className={styles.points}>{formatPoints(result.points)}</strong><small>{result.stage === "qualification" ? "Отбор" : result.included ? "В зачёте" : "Сверх четырёх"}</small></td>
    </tr>)}</tbody></table></div> : <p className={styles.empty}>Опубликованных результатов пока нет.</p>}
  </section>;
}
