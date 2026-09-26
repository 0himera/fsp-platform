import Link from "next/link";
import { ArrowRight, CirclePlus, Trophy } from "lucide-react";
import styles from "./RankingAside.module.css";

export function RankingAside() {
  return <aside className={styles.aside}>
    <section className={styles.method}>
      <h2>Как начисляются баллы</h2>
      <div className={styles.item}><span><Trophy size={22} /></span><div><strong>4 лучших результата</strong><p>В сумму входят четыре сильнейших результата из опубликованных протоколов.</p></div></div>
      <div className={styles.item}><span><CirclePlus size={22} /></span><div><strong>Бонус разряда</strong><p>Подтверждённая квалификация добавляет баллы с учётом активности.</p></div></div>
      <Link href="/info">Методика расчёта <ArrowRight size={16} /></Link>
      <small>Место и баллы рассчитаны рейтинговым API.</small>
    </section>
  </aside>;
}
