import Link from "next/link";
import styles from "./HeaderBrand.module.css";

export function HeaderBrand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Арена — Федерация спортивного программирования Дагестана">
      <svg className={styles.mark} viewBox="0 0 70 48" role="img" aria-label="Горы">
        <path d="M2 42 22 19l8 9 14-18 24 32H2Z" />
        <path d="m15 42 15-17 8 8 7-9 12 18M22 19l8 9 14-18 7 12" />
        <path d="m26 24 4 4 5-6m6-8 5 7 5-4" />
      </svg>
      <span className={styles.copy}>
        <strong>АРЕНА · ФСП ДАГЕСТАНА</strong>
        <small>СПОРТ. ЛЮДИ. РАЗВИТИЕ.</small>
      </span>
    </Link>
  );
}
