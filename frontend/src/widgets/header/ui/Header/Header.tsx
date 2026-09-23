"use client";

import * as React from "react";
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

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <HeaderBrand />
        <HeaderNav />
        <div className={styles.actions}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {user.full_name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                Выйти
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById("login-email");
                el?.focus();
              }}
            >
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

