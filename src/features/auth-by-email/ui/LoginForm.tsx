"use client";

import * as React from "react";
import { Button, Input } from "@/shared/ui";
import type { UserRole } from "@/entities/user";
import { useLoginMutation } from "../api/authApi";
import { RoleSelector } from "./RoleSelector";
import styles from "./LoginForm.module.css";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("athlete");
  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginMutation.mutate({ email, role });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Роль в системе</label>
        <RoleSelector selectedRole={role} onRoleChange={setRole} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Электронная почта</label>
        <Input
          type="email"
          required
          placeholder="sportsman@fsp-rd.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.inputOverride}
        />
      </div>

      {loginMutation.isSuccess && (
        <div className={styles.successMessage}>
          Успешный вход в роли {role === "organizer" ? "организатора" : "спортсмена"}
        </div>
      )}

      <Button
        type="submit"
        disabled={loginMutation.isPending}
        className={styles.submitBtn}
      >
        {loginMutation.isPending ? "Авторизация..." : "Войти в личный кабинет"}
      </Button>
    </form>
  );
};
