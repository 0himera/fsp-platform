import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui";
import type { User } from "@/shared/api";
import styles from "./AuthUserPanel.module.css";

interface AuthUserPanelProps {
  user: User;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export const AuthUserPanel: React.FC<AuthUserPanelProps> = ({
  user,
  onLogout,
  isLoggingOut,
}) => (
  <div className={styles.panel}>
    <div>
      <p className={styles.name}>{user.full_name || user.email}</p>
      <p className={styles.meta}>{user.organization || user.city || user.role}</p>
    </div>
    <div className={styles.actions}>
      <Link
        href={user.role === "organizer" ? "/admin" : "/profile"}
        className={styles.linkBtn}
      >
        <Button size="sm">
          {user.role === "organizer" ? "Панель организатора" : "Личный кабинет"}
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        Выйти
      </Button>
    </div>
  </div>
);
