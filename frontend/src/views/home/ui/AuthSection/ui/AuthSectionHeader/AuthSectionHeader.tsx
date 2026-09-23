import * as React from "react";
import { CardHeader, CardTitle, CardDescription, Button } from "@/shared/ui";
import type { User } from "@/shared/api";
import styles from "./AuthSectionHeader.module.css";

interface AuthSectionHeaderProps {
  user?: User | null;
  tab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

export const AuthSectionHeader: React.FC<AuthSectionHeaderProps> = ({
  user,
  tab,
  onTabChange,
}) => (
  <CardHeader className={styles.header}>
    <CardTitle className={styles.heading}>
      {user ? "Личный кабинет" : tab === "login" ? "Вход в систему" : "Регистрация"}
    </CardTitle>
    <CardDescription className={styles.description}>
      {user
        ? `Вы вошли как ${user.role === "organizer" ? "организатор" : "спортсмен"}`
        : tab === "login"
        ? "Быстрый вход для спортсменов и организаторов"
        : "Создайте аккаунт спортсмена Республики Дагестан"}
    </CardDescription>
    {!user && (
      <div className={styles.tabs}>
        <Button
          size="sm"
          variant={tab === "login" ? "default" : "outline"}
          onClick={() => onTabChange("login")}
        >
          Вход
        </Button>
        <Button
          size="sm"
          variant={tab === "register" ? "default" : "outline"}
          onClick={() => onTabChange("register")}
        >
          Регистрация
        </Button>
      </div>
    )}
  </CardHeader>
);
