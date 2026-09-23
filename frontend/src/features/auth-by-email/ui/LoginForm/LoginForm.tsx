"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import type { UserRole } from "@/entities/user";
import { useLoginMutation, useForgotPasswordMutation, useResendVerificationMutation } from "../../api/authApi";
import { RoleSelector } from "../RoleSelector";
import styles from "./LoginForm.module.css";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("athlete1@arena.local");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("athlete");
  const [view, setView] = React.useState<"login" | "forgot" | "resend">("login");

  const loginMutation = useLoginMutation();
  const forgotMutation = useForgotPasswordMutation();
  const resendMutation = useResendVerificationMutation();

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

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    forgotMutation.mutate(email.trim());
  };

  const handleResendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    resendMutation.mutate(email.trim());
  };

  if (view === "forgot") {
    return (
      <form onSubmit={handleForgotSubmit} className={styles.form}>
        <h4 style={{ fontWeight: 600, fontSize: "1rem" }}>Восстановление пароля</h4>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Введите email, указанный при регистрации. Мы отправим ссылку для смены пароля.
        </p>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="forgot-email">Электронная почта</label>
          <Input
            id="forgot-email"
            type="email"
            required
            placeholder="athlete@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </div>

        {forgotMutation.isSuccess && (
          <div style={{ color: "#10b981", fontSize: "0.85rem" }}>
            ✓ Ссылка для сброса пароля отправлена! Проверьте почту (или Mailpit :8025).
          </div>
        )}

        {forgotMutation.isError && (
          <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>
            Ошибка отправки письма. Убедитесь, что email корректен.
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button type="submit" disabled={forgotMutation.isPending}>
            {forgotMutation.isPending ? "Отправка..." : "Отправить ссылку"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setView("login")}>
            Назад ко входу
          </Button>
        </div>
      </form>
    );
  }

  if (view === "resend") {
    return (
      <form onSubmit={handleResendSubmit} className={styles.form}>
        <h4 style={{ fontWeight: 600, fontSize: "1rem" }}>Повторное письмо активации</h4>
        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Если вы ещё не активировали учётную запись, введите почту для повторной отправки письма.
        </p>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="resend-email">Электронная почта</label>
          <Input
            id="resend-email"
            type="email"
            required
            placeholder="athlete@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </div>

        {resendMutation.isSuccess && (
          <div style={{ color: "#10b981", fontSize: "0.85rem" }}>
            ✓ Ссылка активации повторно отправлена! Проверьте почту (или Mailpit :8025).
          </div>
        )}

        {resendMutation.isError && (
          <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>
            Ошибка отправки. Убедитесь, что аккаунт зарегистрирован.
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button type="submit" disabled={resendMutation.isPending}>
            {resendMutation.isPending ? "Отправка..." : "Отправить письмо"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setView("login")}>
            Назад ко входу
          </Button>
        </div>
      </form>
    );
  }

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className={styles.label} htmlFor="login-password">Пароль (опционально для демо)</label>
          <button
            type="button"
            style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}
            onClick={() => setView("forgot")}
          >
            Забыли пароль?
          </button>
        </div>
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
          <div>{loginMutation.error instanceof Error ? loginMutation.error.message : "Ошибка входа"}</div>
          {loginMutation.error instanceof Error && loginMutation.error.message.includes("Подтвердите") && (
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "0.8rem", cursor: "pointer", marginTop: "0.25rem", padding: 0, textDecoration: "underline" }}
              onClick={() => setView("resend")}
            >
              Отправить письмо с подтверждением повторно →
            </button>
          )}
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

      <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
        <button
          type="button"
          style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "0.8rem", cursor: "pointer" }}
          onClick={() => setView("resend")}
        >
          Не пришло письмо с подтверждением?
        </button>
      </div>
    </form>
  );
};

