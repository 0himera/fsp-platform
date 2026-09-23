"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import type { UserRole } from "@/entities/user";
import { useLoginMutation } from "../../api/authApi";
import { RoleSelector } from "../RoleSelector";
import styles from "./LoginForm.module.css";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("athlete1@arena.local");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("athlete");
  const loginMutation = useLoginMutation();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "organizer") {
      setEmail("organizer@arena.local");
    } else {
      setEmail("athlete1@arena.local");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginMutation.mutate({ email, password: password || undefined, role });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Роль в системе</label>
        <RoleSelector selectedRole={role} onRoleChange={handleRoleChange} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-email">Электронная почта</label>
        <Input
          id="login-email"
          type="email"
          required
          placeholder={role === "organizer" ? "organizer@arena.local" : "athlete1@arena.local"}
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className={styles.inputOverride}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-password">Пароль (опционально для демо)</label>
        <Input
          id="login-password"
          type="password"
          placeholder="Оставьте пустым для демо-пароля"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          className={styles.inputOverride}
        />
      </div>

      {loginMutation.isError && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem", padding: "0.5rem 0" }}>
          {loginMutation.error instanceof Error ? loginMutation.error.message : "Ошибка входа"}
        </div>
      )}

      {loginMutation.isSuccess && (
        <div className={styles.successMessage}>
          Успешный вход в роли {loginMutation.data?.user.role === "organizer" ? "организатора" : "спортсмена"}
        </div>
      )}

      <Button
        type="submit"
        disabled={loginMutation.isPending}
        className={styles.submitBtn}
      >
        {loginMutation.isPending ? "Авторизация..." : "Войти в личный кабинет"}
      </Button>
    </form>
  );
};

