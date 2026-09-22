import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui";
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
    <Tabs
      value={selectedRole}
      onValueChange={(val) => onRoleChange(val as UserRole)}
      className={styles.container}
    >
      <TabsList className={styles.tabsList}>
        <TabsTrigger value="athlete" className={styles.tabTrigger}>
          Спортсмен
        </TabsTrigger>
        <TabsTrigger value="organizer" className={styles.tabTrigger}>
          Организатор
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
