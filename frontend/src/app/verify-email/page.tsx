"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/shared/ui";
import { useVerifyEmailMutation, useResendVerificationMutation } from "@/features/auth-by-email";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();

  const [resendEmail, setResendEmail] = React.useState("");
  const [hasTriggered, setHasTriggered] = React.useState(false);

  React.useEffect(() => {
    if (token && !hasTriggered) {
      setHasTriggered(true);
      verifyMutation.mutate(token);
    }
  }, [token, hasTriggered, verifyMutation]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    resendMutation.mutate(resendEmail.trim());
  };

  return (
    <main style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1.5rem" }}>
      <Card>
        <CardHeader>
          <CardTitle>Подтверждение электронной почты</CardTitle>
          <CardDescription>
            Активация учётной записи на платформе Арена ФСП РД
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifyMutation.isPending && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p>Проверка ссылки подтверждения...</p>
            </div>
          )}

          {verifyMutation.isSuccess && (
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
                ✓ Электронная почта успешно подтверждена! Сессия авторизована.
              </div>
              <p>
                Добро пожаловать, {verifyMutation.data.user.full_name || verifyMutation.data.user.email}!
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button onClick={() => router.push("/profile")}>
                  Перейти в личный кабинет
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  На главную страницу
                </Button>
              </div>
            </div>
          )}

          {(verifyMutation.isError || (!token && !verifyMutation.isPending)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div
                style={{
                  padding: "1rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  color: "#ef4444",
                }}
              >
                {verifyMutation.error instanceof Error
                  ? verifyMutation.error.message
                  : "Ссылка недействительна или срок её действия истёк."}
              </div>

              <div>
                <h4 style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                  Отправить повторное письмо с подтверждением
                </h4>
                <form onSubmit={handleResend} style={{ display: "flex", gap: "0.5rem" }}>
                  <Input
                    type="email"
                    required
                    placeholder="Ваша почта..."
                    value={resendEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResendEmail(e.target.value)}
                  />
                  <Button type="submit" disabled={resendMutation.isPending}>
                    {resendMutation.isPending ? "Отправка..." : "Отправить"}
                  </Button>
                </form>
                {resendMutation.isSuccess && (
                  <p style={{ color: "#10b981", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                    ✓ Письмо со ссылкой отправлено. Проверьте почтовый ящик (или Mailpit :8025).
                  </p>
                )}
                {resendMutation.isError && (
                  <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                    Ошибка отправки письма. Убедитесь, что email зарегистрирован.
                  </p>
                )}
              </div>

              <Button variant="outline" onClick={() => router.push("/")}>
                Вернуться на главную
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<div style={{ textAlign: "center", padding: "4rem" }}>Загрузка...</div>}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
