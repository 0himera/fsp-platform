"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import type { UserRole } from "@/entities/user";
import { useLoginMutation } from "../../api/authApi";
import { RoleSelector } from "../RoleSelector";
import { ForgotPasswordForm } from "../ForgotPasswordForm";
import { ResendVerificationForm } from "../ResendVerificationForm";
import { LoginExtraLinks } from "../LoginExtraLinks";
import styles from "./LoginForm.module.css";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("athlete1@arena.local");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("athlete");
  const [view, setView] = React.useState<"login" | "forgot" | "resend">("login");

  const loginMutation = useLoginMutation();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setEmail(newRole === "organizer" ? "organizer@arena.local" : "athlete1@arena.local");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginMutation.mutate({ email, password: password || undefined, role });
  };

  if (view === "forgot") return <ForgotPasswordForm onBack={() => setView("login")} />;
  if (view === "resend") return <ResendVerificationForm onBack={() => setView("login")} />;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <RoleSelector selectedRole={role} onRoleChange={handleRoleChange} />
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-email">Электронная почта</label>
        <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-password">Пароль</label>
        <Input id="login-password" type="password" placeholder="Оставьте пустым для демо-входа" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {loginMutation.isError && (
        <p className={styles.error}>{loginMutation.error?.message || "Ошибка входа"}</p>
      )}
      <Button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Вход..." : "Войти"}
      </Button>
      <LoginExtraLinks onForgot={() => setView("forgot")} onResend={() => setView("resend")} />
    </form>
  );
};
