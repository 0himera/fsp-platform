"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui";
import { useMeQuery } from "@/entities/user";
import { useLogoutMutation } from "@/features/auth-by-email";
import { HeaderBrand } from "../HeaderBrand";
import { HeaderNav } from "../HeaderNav";
import { HeaderUserMenu } from "../HeaderUserMenu";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const { data: me } = useMeQuery();
  const logoutMutation = useLogoutMutation();
  const user = me?.user;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <HeaderBrand />
        <HeaderNav />
        <div className={styles.actions}>
          {user ? (
            <HeaderUserMenu
              user={user}
              onLogout={() => logoutMutation.mutate()}
              isLoggingOut={logoutMutation.isPending}
            />
          ) : (
            <Link href="/#" className={styles.link}>
              <Button size="sm">Войти</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
