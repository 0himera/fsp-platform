import * as React from "react";
import { Button } from "@/shared/ui";
import type { UserRole } from "@/entities/user";
import styles from "./RegisterRoleSelector.module.css";

const ROLES: { id: UserRole; label: string }[] = [
  { id: "athlete", label: "Спортсмен" },
  { id: "coach", label: "Тренер" },
  { id: "judge", label: "Судья" },
];

interface RegisterRoleSelectorProps {
  role: UserRole;
  onChange: (role: UserRole) => void;
}

export const RegisterRoleSelector: React.FC<RegisterRoleSelectorProps> = ({ role, onChange }) => (
  <div className={styles.container}>
    <label className={styles.label}>Роль на платформе</label>
    <div className={styles.rolesGroup}>
      {ROLES.map((item) => (
        <Button
          key={item.id}
          type="button"
          size="sm"
          variant={role === item.id ? "default" : "outline"}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  </div>
);
