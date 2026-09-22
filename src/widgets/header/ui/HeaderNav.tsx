import * as React from "react";
import styles from "./HeaderNav.module.css";

const navItems = [
  { label: "Главная", href: "/", active: true },
  { label: "Соревнования", href: "#competitions", active: false },
  { label: "Рейтинг РД", href: "#ratings", active: false },
  { label: "Документы", href: "#docs", active: false },
];

export const HeaderNav: React.FC = () => {
  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className={`${styles.link} ${item.active ? styles.active : ""}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
};
