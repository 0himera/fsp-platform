"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useRegisterForm } from "../../model/useRegisterForm";
import { RegisterSuccessNotice } from "../RegisterSuccessNotice";
import { RegisterFormFields } from "../RegisterFormFields";
import styles from "./RegisterForm.module.css";

const ROLES = [
  { id: "athlete" as const, label: "Спортсмен" },
  { id: "coach" as const, label: "Тренер" },
  { id: "judge" as const, label: "Судья" },
];

export const RegisterForm: React.FC = () => {
  const form = useRegisterForm();

  if (form.registerMutation.isSuccess) {
    return (
      <RegisterSuccessNotice
        email={form.email}
        mailSent={form.registerMutation.data?.mail_sent}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={form.handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Роль на платформе</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {ROLES.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={form.role === item.id ? "default" : "outline"}
              onClick={() => form.setRole(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <RegisterFormFields
        fullName={form.fullName}
        onFullNameChange={form.setFullName}
        email={form.email}
        onEmailChange={form.setEmail}
        password={form.password}
        onPasswordChange={form.setPassword}
        city={form.city}
        onCityChange={form.setCity}
        organization={form.organization}
        onOrgChange={form.setOrganization}
      />
      {form.registerMutation.isError && (
        <p className={styles.error}>{form.registerMutation.error?.message || "Ошибка регистрации"}</p>
      )}
      <Button type="submit" disabled={form.registerMutation.isPending}>
        {form.registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
};
