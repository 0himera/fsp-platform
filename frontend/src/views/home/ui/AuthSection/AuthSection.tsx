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
import { LoginForm, RegisterForm, useLogoutMutation } from "@/features/auth-by-email";
import { useMeQuery } from "@/entities/user";
import styles from "./AuthSection.module.css";

export const AuthSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const logoutMutation = useLogoutMutation();
  const [tab, setTab] = React.useState<"login" | "register">("login");

  const user = me?.user;

  return (
    <Card className={styles.section}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.heading}>
          {user ? "Личный кабинет" : tab === "login" ? "Вход в систему" : "Регистрация спортсмена"}
        </CardTitle>
        <CardDescription className={styles.description}>
          {user
            ? `Вы вошли как ${user.role === "organizer" ? "организатор" : "спортсмен"}`
            : tab === "login"
            ? "Быстрый вход для спортсменов сборной и организаторов"
            : "Создайте аккаунт спортсмена Республики Дагестан"}
        </CardDescription>

        {!user && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button
              size="sm"
              variant={tab === "login" ? "default" : "outline"}
              onClick={() => setTab("login")}
            >
              Вход
            </Button>
            <Button
              size="sm"
              variant={tab === "register" ? "default" : "outline"}
              onClick={() => setTab("register")}
            >
              Регистрация
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className={styles.content}>
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.05rem" }}>{user.full_name || user.email}</p>
              <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>{user.email}</p>
              {user.organization && (
                <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>{user.organization} · {user.city}</p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {user.role === "athlete" && (
                <a href="/profile">
                  <Button size="sm">Мой профиль и заявки</Button>
                </a>
              )}
              {user.role === "organizer" && (
                <a href="/admin">
                  <Button size="sm">Панель организатора</Button>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                {logoutMutation.isPending ? "Выход..." : "Выйти из системы"}
              </Button>
            </div>
          </div>
        ) : tab === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm />
        )}
      </CardContent>
    </Card>
  );
};

export default AuthSection;

