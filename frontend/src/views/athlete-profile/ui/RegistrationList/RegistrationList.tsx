import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Competition } from "@/shared/api";
import { COMPETITION_STATUSES } from "@/shared/config";
import { formatDate } from "@/shared/lib";
import styles from "./RegistrationList.module.css";

export function RegistrationList({ items }: { items: Competition[] }) {
  return <section className={styles.section}>
    <header><div><span>Участие</span><h2>Мои заявки</h2></div><Link href="/events">Выбрать соревнование →</Link></header>
    {items.length ? items.map((item) => <Link href={`/competitions/${item.id}`} className={styles.row} key={item.id}>
      <span><CalendarDays size={15} />{formatDate(item.starts_at)}</span><strong>{item.title}<small>{item.location || "Онлайн"}</small></strong><i>{COMPETITION_STATUSES[item.status] || item.status}</i>
    </Link>) : <p className={styles.empty}>Активных заявок пока нет.</p>}
  </section>;
}
