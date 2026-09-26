"use client";

import * as React from "react";
import Link from "next/link";
import { apiClient } from "@/shared/api";

export default function VerifyEmailChangePage() {
  const [status, setStatus] = React.useState("Проверяем ссылку…");
  React.useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setStatus("Ссылка недействительна."); return; }
    apiClient.post("/api/auth/verify-email-change", { token }).then(() => setStatus("Почта изменена. Войдите с новым адресом.")).catch((error: Error) => setStatus(error.message));
  }, []);
  return <main style={{ maxWidth: 600, margin: "5rem auto", padding: "1.5rem" }}><h1>Смена электронной почты</h1><p>{status}</p><Link href="/login">Перейти ко входу</Link></main>;
}
