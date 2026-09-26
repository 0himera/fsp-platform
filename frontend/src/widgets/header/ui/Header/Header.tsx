"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/shared/ui";
import { useMeQuery } from "@/entities/user";
import { useLogoutMutation } from "@/features/auth-by-email";
import { HeaderBrand } from "../HeaderBrand";
import { HeaderNav } from "../HeaderNav";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const { data: me } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  const user = me?.user;
  const accountHref = user?.role === "organizer" ? "/admin" : user ? "/profile" : "/login";
  const displayName = me?.athlete?.full_name || user?.full_name || user?.email;
  const avatarUrl = me?.athlete?.avatar_url;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <HeaderBrand />
        <HeaderNav profileHref={accountHref} />
        <div className={styles.actions}>
          <svg className={styles.mountains} viewBox="0 0 320 72" aria-hidden="true">
            <path d="M2 65 53 19l20 20 27-31 52 57M70 65l58-42 24 20 31-31 63 53M178 65l46-38 25 19 31-33 38 52" />
            <path d="m42 29 11 5 20 5m-1 19 27-20 22 18m36-15 31 7 17 17m31-20 25 8 31-14" />
          </svg>
          {user && <span className={styles.userName} title={displayName}>{displayName}</span>}
          <Link className={styles.accountLink} href={accountHref} aria-label={user ? `Открыть профиль ${displayName}` : "Войти"}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : user ? <span className={styles.accountInitial}>{(displayName || "?").slice(0, 1).toLocaleUpperCase("ru-RU")}</span> : <UserRound size={19} strokeWidth={1.6} />}
          </Link>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className={styles.logout}
              type="button"
              aria-label="Выйти"
              title="Выйти"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
