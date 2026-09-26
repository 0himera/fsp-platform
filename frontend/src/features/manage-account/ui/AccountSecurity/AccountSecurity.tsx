"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/shared/api";
import styles from "./AccountSecurity.module.css";

export function AccountSecurity({ email }: { email: string }) {
  const router = useRouter();
  const [nextEmail, setNextEmail] = React.useState(email);
  const [current, setCurrent] = React.useState("");
  const [password, setPassword] = React.useState("");
  const emailChange = useMutation({ mutationFn: () => apiClient.post("/api/me/email-change", { email: nextEmail }) });
  const passwordChange = useMutation({ mutationFn: () => apiClient.post("/api/me/password", { current_password: current, new_password: password }), onSuccess: () => router.push("/login") });
  return <section className={styles.panel}><h2>Безопасность аккаунта</h2>
    <form onSubmit={(event) => { event.preventDefault(); emailChange.mutate(); }}><label>Новая почта<input type="email" required value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} /></label><button disabled={emailChange.isPending}>Подтвердить смену почты</button>{emailChange.isSuccess && <small>Откройте ссылку из письма, чтобы подтвердить новый адрес.</small>}</form>
    <form onSubmit={(event) => { event.preventDefault(); passwordChange.mutate(); }}><label>Текущий пароль<input type="password" required value={current} onChange={(event) => setCurrent(event.target.value)} /></label><label>Новый пароль<input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button disabled={passwordChange.isPending}>Сменить пароль</button>{passwordChange.isSuccess && <small>Пароль обновлён. Войдите снова.</small>}</form>
    {(emailChange.isError || passwordChange.isError) && <p role="alert">{String(emailChange.error || passwordChange.error)}</p>}
  </section>;
}
