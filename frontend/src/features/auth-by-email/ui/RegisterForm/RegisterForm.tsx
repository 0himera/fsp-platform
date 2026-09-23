"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useRegisterMutation } from "../../api/authApi";
import { RegisterSuccessNotice } from "../RegisterSuccessNotice";
import { RegisterFormFields } from "../RegisterFormFields";
import styles from "./RegisterForm.module.css";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = () => {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [city, setCity] = React.useState("");
  const [organization, setOrganization] = React.useState("");

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
    });
  };

  if (registerMutation.isSuccess) {
    return (
      <RegisterSuccessNotice
        email={email}
        mailSent={registerMutation.data?.mail_sent}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <RegisterFormFields
        fullName={fullName}
        onFullNameChange={setFullName}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        city={city}
        onCityChange={setCity}
        organization={organization}
        onOrgChange={setOrganization}
      />
      {registerMutation.isError && (
        <p className={styles.error}>{registerMutation.error?.message || "Ошибка регистрации"}</p>
      )}
      <Button type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
};
