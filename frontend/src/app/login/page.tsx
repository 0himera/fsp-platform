"use client";

import * as React from "react";
import { LoginForm, RegisterForm } from "@/features/auth-by-email";
import { Button } from "@/shared/ui";
import styles from "./login.module.css";

export default function LoginPage() {
  const [mode, setMode] = React.useState<"login" | "register">("login");
  return <main className={styles.page}><section className={styles.panel}>
    <span>АРЕНА · ФСП ДАГЕСТАНА</span><h1>{mode === "login" ? "Войти в аккаунт" : "Создать профиль спортсмена"}</h1><p>{mode === "login" ? "Доступ к профилю, заявкам и результатам." : "Регистрация для спортсменов Республики Дагестан."}</p>
    <div className={styles.tabs}><Button variant={mode === "login" ? "default" : "ghost"} size="sm" onClick={() => setMode("login")}>Вход</Button><Button variant={mode === "register" ? "default" : "ghost"} size="sm" onClick={() => setMode("register")}>Регистрация</Button></div>
    {mode === "login" ? <LoginForm /> : <RegisterForm />}
  </section></main>;
}
