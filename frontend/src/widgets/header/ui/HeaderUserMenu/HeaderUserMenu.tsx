import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui";
import type { User } from "@/shared/api";
import styles from "./HeaderUserMenu.module.css";

interface HeaderUserMenuProps {
  user: User;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({
  user,
  onLogout,
  isLoggingOut,
}) => (
  <div className={styles.userActions}>
    {user.role === "organizer" ? (
      <Link href="/admin" className={styles.link}>
        <Button variant="outline" size="sm">Панель организатора</Button>
      </Link>
    ) : (
      <Link href="/profile" className={styles.link}>
        <Button variant="outline" size="sm">
          {user.full_name || "Личный кабинет"}
        </Button>
      </Link>
    )}
    <Button variant="outline" size="sm" disabled={isLoggingOut} onClick={onLogout}>
      Выйти
    </Button>
  </div>
);
