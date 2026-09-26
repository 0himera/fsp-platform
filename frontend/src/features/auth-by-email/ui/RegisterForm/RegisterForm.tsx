"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useRegisterMutation } from "../../api/authApi";
import styles from "./RegisterForm.module.css";

export const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [city, setCity] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [role, setRole] = React.useState<"athlete" | "coach" | "judge">("athlete");

  const registerMutation = useRegisterMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;

    registerMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      city: city.trim() || undefined,
      organization: organization.trim() || undefined,
      role,
    });
  };

  if (registerMutation.isSuccess) {
    const data = registerMutation.data;
    return (
      <div className={styles.successBox}>
        <h3 className={styles.successTitle}>
          {data?.mail_sent ? "Проверьте почту" : "Аккаунт создан"}
        </h3>
        <p className={styles.successDesc}>
          {data?.mail_sent
            ? `Мы отправили ссылку для подтверждения на ${email}. Откройте письмо для активации аккаунта.`
            : "Аккаунт создан. Локальные письма перехватывает Mailpit (localhost:8025)."}
        </p>
        <p className={styles.hint}>
          Для локального тестирования письма доступны в Mailpit на{" "}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer" className={styles.link}>
            localhost:8025
          </a>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Роль на платформе</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "athlete", label: "Спортсмен" },
            { id: "coach", label: "Тренер" },
            { id: "judge", label: "Судья" },
          ].map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={role === item.id ? "default" : "outline"}
              onClick={() => setRole(item.id as "athlete" | "coach" | "judge")}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="reg-name">ФИО *</label>
        <Input
          id="reg-name"
          required
          placeholder="Иванов Иван Иванович"
          value={fullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="reg-email">Электронная почта *</label>
        <Input
          id="reg-email"
          type="email"
          required
          placeholder="athlete@example.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="reg-password">Пароль (от 8 символов) *</label>
        <Input
          id="reg-password"
          type="password"
          required
          minLength={8}
          placeholder="Придумайте надёжный пароль"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reg-city">Город / Населённый пункт</label>
          <Input
            id="reg-city"
            placeholder="Махачкала, Каспийск..."
            value={city}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reg-org">Образовательная организация / ВУЗ</label>
          <Input
            id="reg-org"
            placeholder="ДГУ, ДГТУ, Лицей..."
            value={organization}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrganization(e.target.value)}
          />
        </div>
      </div>

      {registerMutation.isError && (
        <div className={styles.error}>
          {registerMutation.error instanceof Error
            ? registerMutation.error.message
            : "Ошибка регистрации. Проверьте введённые данные."}
        </div>
      )}

      <Button
        type="submit"
        disabled={registerMutation.isPending}
        className={styles.submitBtn}
      >
        {registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
};
