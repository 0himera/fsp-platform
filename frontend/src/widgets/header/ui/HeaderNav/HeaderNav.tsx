"use client";

import * as React from "react";
import styles from "./HeaderNav.module.css";

const navItems = [
  { label: "Главная", href: "/#" },
  { label: "Соревнования", href: "/#competitions" },
  { label: "Рейтинг РД", href: "/#ratings" },
  { label: "Документы", href: "/#docs" },
];

export const HeaderNav: React.FC = () => {
  const [activeHash, setActiveHash] = React.useState("");

  React.useEffect(() => {
    const handleHash = () => {
      setActiveHash(window.location.hash || "");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const hash = item.href.replace("/#", "#");
        const isActive =
          (!activeHash && (item.href === "/" || item.href === "/#")) ||
          (Boolean(activeHash) && hash === activeHash);

        return (
          <a
            key={item.label}
            href={item.href}
            onClick={() => setActiveHash(hash === "#" ? "" : hash)}
            className={`${styles.link} ${isActive ? styles.active : ""}`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
};

