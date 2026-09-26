"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/shared/ui";
import { useVerifyEmailMutation, useResendVerificationMutation } from "@/features/auth-by-email";
import styles from "./VerifyEmailContent.module.css";

export const VerifyEmailContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const [resendEmail, setResendEmail] = React.useState("");
  const hasTriggeredRef = React.useRef(false);

  React.useEffect(() => {
    if (token && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      verifyMutation.mutate(token);
    }
  }, [token, verifyMutation]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (resendEmail.trim()) resendMutation.mutate(resendEmail.trim());
  };

  return (
    <main className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Подтверждение электронной почты</CardTitle>
          <CardDescription>Активация учётной записи на платформе Арена ФСП РД</CardDescription>
        </CardHeader>
        <CardContent>
          {verifyMutation.isPending && <p className={styles.pending}>Проверка ссылки...</p>}
          {verifyMutation.isSuccess && (
            <div className={styles.successBox}>
              <div className={styles.successAlert}>Электронная почта успешно подтверждена!</div>
              <Button onClick={() => router.push("/profile")}>В личный кабинет</Button>
            </div>
          )}
          {verifyMutation.isError && (
            <div className={styles.errorBox}>
              <div className={styles.errorAlert}>Ссылка недействительна или срок её действия истёк</div>
              <form onSubmit={handleResend} className={styles.resendForm}>
                <Input type="email" placeholder="Ваш email" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} required />
                <Button type="submit" disabled={resendMutation.isPending}>Отправить повторно</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};
