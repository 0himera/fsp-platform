"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/shared/ui";
import { useResetPasswordMutation } from "@/features/auth-by-email";
import styles from "./ResetPasswordContent.module.css";

export const ResetPasswordContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const resetMutation = useResetPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setErrorMsg("Отсутствует токен сброса пароля.");
    if (password.length < 8) return setErrorMsg("Пароль должен содержать от 8 символов.");
    if (password !== confirmPassword) return setErrorMsg("Пароли не совпадают.");
    resetMutation.mutate({ token, password });
  };

  return (
    <main className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Сброс пароля</CardTitle>
          <CardDescription>Придумайте новый пароль для вашей учётной записи</CardDescription>
        </CardHeader>
        <CardContent>
          {resetMutation.isSuccess ? (
            <div className={styles.successBox}>
              <div className={styles.successAlert}>Пароль успешно изменён!</div>
              <Button onClick={() => router.push("/#")}>Войти в систему</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Новый пароль</label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Подтверждение</label>
                <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              {errorMsg && <p className={styles.error}>{errorMsg}</p>}
              <Button type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? "Сохранение..." : "Изменить пароль"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};
