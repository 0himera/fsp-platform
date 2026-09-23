"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/shared/ui";
import { useResetPasswordMutation } from "@/features/auth-by-email";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const resetMutation = useResetPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Отсутствует токен сброса пароля.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Пароль должен содержать не менее 8 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Пароли не совпадают.");
      return;
    }

    resetMutation.mutate({ token, password });
  };

  return (
    <main style={{ maxWidth: "540px", margin: "4rem auto", padding: "0 1.5rem" }}>
      <Card>
        <CardHeader>
          <CardTitle>Сброс пароля</CardTitle>
          <CardDescription>
            Придумайте новый надёжный пароль для вашей учётной записи
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetMutation.isSuccess ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  padding: "1rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "8px",
                  color: "#10b981",
                }}
              >
                ✓ Пароль успешно изменён! Теперь вы можете войти в систему с новым паролем.
              </div>
              <Button onClick={() => router.push("/#")}>Войти в аккаунт</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {!token && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "6px",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                  }}
                >
                  Токен сброса пароля отсутствует или ссылка повреждена. Запросите новую ссылку.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }} htmlFor="new-pwd">
                  Новый пароль (от 8 символов) *
                </label>
                <Input
                  id="new-pwd"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Введите новый пароль"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }} htmlFor="confirm-pwd">
                  Повторите новый пароль *
                </label>
                <Input
                  id="confirm-pwd"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                />
              </div>

              {(errorMsg || resetMutation.isError) && (
                <div
                  style={{
                    color: "#ef4444",
                    fontSize: "0.875rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    padding: "0.75rem",
                    borderRadius: "6px",
                  }}
                >
                  {errorMsg ||
                    (resetMutation.error instanceof Error
                      ? resetMutation.error.message
                      : "Ошибка сброса пароля.")}
                </div>
              )}

              <Button type="submit" disabled={resetMutation.isPending || !token}>
                {resetMutation.isPending ? "Сохранение..." : "Сохранить новый пароль"}
              </Button>

              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Отмена
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div style={{ textAlign: "center", padding: "4rem" }}>Загрузка...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}
