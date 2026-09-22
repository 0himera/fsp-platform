import * as React from "react";
import { Button } from "@/shared/ui";
import type { UserRole } from "@/entities/user";
import styles from "./RoleSelector.module.css";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
}) => {
  return (
    <div className={styles.container}>
      <Button
        type="button"
        size="sm"
        variant={selectedRole === "athlete" ? "secondary" : "ghost"}
        className={`${styles.roleButton} ${selectedRole === "athlete" ? styles.active : ""}`}
        onClick={() => onRoleChange("athlete")}
      >
        Спортсмен
      </Button>
      <Button
        type="button"
        size="sm"
        variant={selectedRole === "organizer" ? "secondary" : "ghost"}
        className={`${styles.roleButton} ${selectedRole === "organizer" ? styles.active : ""}`}
        onClick={() => onRoleChange("organizer")}
      >
        Организатор
      </Button>
    </div>
  );
};
