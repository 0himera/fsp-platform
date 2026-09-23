"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@/shared/ui";
import { LoginForm, useLogoutMutation } from "@/features/auth-by-email";
import { useMeQuery } from "@/entities/user";
import styles from "./AuthSection.module.css";

export const AuthSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  const user = me?.user;

  return (
    <Card className={styles.section}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.heading}>
          {user ? "Личный кабинет" : "Авторизация в системе"}
        </CardTitle>
        <CardDescription className={styles.description}>
          {user
            ? `Вы вошли как ${user.role === "organizer" ? "организатор" : "спортсмен"}`
            : "Быстрый вход для спортсменов сборной и организаторов соревнований"}
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.content}>
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <p style={{ fontWeight: 600 }}>{user.full_name || user.email}</p>
              <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>{user.email}</p>
              {user.organization && (
                <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>{user.organization}</p>
              )}
            </div>
            <Button
              variant="outline"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? "Выход..." : "Выйти из системы"}
            </Button>
          </div>
        ) : (
          <LoginForm />
        )}
      </CardContent>
    </Card>
  );
};

export default AuthSection;
