"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useRegisterForm } from "../../model/useRegisterForm";
import { RegisterSuccessNotice } from "../RegisterSuccessNotice";
import { RegisterFormFields } from "../RegisterFormFields";
import { RegisterRoleSelector } from "../RegisterRoleSelector";
import styles from "./RegisterForm.module.css";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess: _onSuccess }) => {
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
      <RegisterRoleSelector role={form.role} onChange={form.setRole} />
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
