"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./HeaderNav.module.css";

const navItems = [
  { label: "Главная", href: "/", matches: (path: string) => path === "/" },
  { label: "События", href: "/events", matches: (path: string) => path === "/events" || path === "/calendar" || path.startsWith("/competitions") },
  { label: "Рейтинг", href: "/rankings", matches: (path: string) => path === "/rankings" },
  { label: "Документы", href: "/info", matches: (path: string) => path === "/info" },
];

interface HeaderNavProps {
  profileHref: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ profileHref }) => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Основная навигация">
      {navItems.map((item) => {
        const active = item.matches(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href={profileHref}
        className={`${styles.link} ${pathname === "/profile" || pathname.startsWith("/athletes/") || pathname === "/admin" ? styles.active : ""}`}
        aria-current={pathname === "/profile" || pathname.startsWith("/athletes/") || pathname === "/admin" ? "page" : undefined}
      >
        Профиль
      </Link>
    </nav>
  );
};
