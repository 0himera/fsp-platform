import Link from "next/link";
import { ArrowRight, CirclePlus, Trophy } from "lucide-react";
import styles from "./RankingAside.module.css";

export function RankingAside() {
  return <aside className={styles.aside}>
    <section className={styles.banner}>
      <svg viewBox="0 0 340 120" aria-hidden="true"><path d="m-5 105 52-54 21 20 34-50 53 84m-107 0 62-39 25 21 33-58 76 76m-68 0 47-43 21 22 39-56 63 77" /><path d="m31 66 17 6 20 0m-15 29 50-33 24 12m26-2 33-18 23 16m40-7 21 8 27-24" /></svg>
      <span>АРЕНА · ФСП ДАГЕСТАНА</span><strong>Больше,<br />чем соревнования.</strong><small>Сильнее, чем вчера.</small>
    </section>
    <section className={styles.method}>
      <h2>Как начисляются баллы</h2>
      <div className={styles.item}><span><Trophy size={22} /></span><div><strong>4 лучших результата</strong><p>В сумму входят четыре сильнейших результата из опубликованных протоколов.</p></div></div>
      <div className={styles.item}><span><CirclePlus size={22} /></span><div><strong>Бонус разряда</strong><p>Подтверждённая квалификация добавляет баллы с учётом активности.</p></div></div>
      <Link href="/info">Методика расчёта <ArrowRight size={16} /></Link>
      <small>Место и баллы рассчитаны рейтинговым API.</small>
    </section>
  </aside>;
}
