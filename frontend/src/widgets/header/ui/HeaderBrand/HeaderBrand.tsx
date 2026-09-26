import Link from "next/link";
import styles from "./HeaderBrand.module.css";

export function HeaderBrand() {
  return (
    <Link href="/" className={styles.brand} aria-label="ФСП Республики Дагестан">
      <span className={styles.mark} role="img" aria-label="Логотип Федерации спортивного программирования Дагестана" />
      <span className={styles.copy}>
        <span className={styles.wordmark} role="img" aria-label="ФСП" />
        <span className={styles.description}>
          <b>РЕСПУБЛИКИ</b>
          <b>ДАГЕСТАН</b>
        </span>
      </span>
    </Link>
  );
}
