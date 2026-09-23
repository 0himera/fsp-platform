import * as React from "react";
import { Input } from "@/shared/ui";
import styles from "./RegisterFormFields.module.css";

interface RegisterFormFieldsProps {
  fullName: string;
  onFullNameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  organization: string;
  onOrgChange: (v: string) => void;
}

export const RegisterFormFields: React.FC<RegisterFormFieldsProps> = ({
  fullName, onFullNameChange,
  email, onEmailChange,
  password, onPasswordChange,
  city, onCityChange,
  organization, onOrgChange,
}) => (
  <div className={styles.fields}>
    <Input required placeholder="ФИО (Иванов Иван Иванович) *" value={fullName} onChange={(e) => onFullNameChange(e.target.value)} />
    <Input type="email" required placeholder="Электронная почта *" value={email} onChange={(e) => onEmailChange(e.target.value)} />
    <Input type="password" required placeholder="Пароль *" value={password} onChange={(e) => onPasswordChange(e.target.value)} />
    <Input placeholder="Город (например, Махачкала)" value={city} onChange={(e) => onCityChange(e.target.value)} />
    <Input placeholder="Вуз / Школа / Организация" value={organization} onChange={(e) => onOrgChange(e.target.value)} />
  </div>
);
