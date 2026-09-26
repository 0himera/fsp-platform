"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useLoginForm } from "../../model/useLoginForm";
import { RoleSelector } from "../RoleSelector";
import { ForgotPasswordForm } from "../ForgotPasswordForm";
import { ResendVerificationForm } from "../ResendVerificationForm";
import { LoginExtraLinks } from "../LoginExtraLinks";
import styles from "./LoginForm.module.css";

export const LoginForm: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    role,
    view,
    setView,
    loginMutation,
    handleRoleChange,
    handleSubmit,
  } = useLoginForm();

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
