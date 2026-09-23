"use client";

import * as React from "react";
import { Card, CardContent } from "@/shared/ui";
import { LoginForm, RegisterForm, useLogoutMutation } from "@/features/auth-by-email";
import { useMeQuery } from "@/entities/user";
import { AuthUserPanel } from "./ui/AuthUserPanel";
import { AuthSectionHeader } from "./ui/AuthSectionHeader";
import styles from "./AuthSection.module.css";

export const AuthSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const logoutMutation = useLogoutMutation();
  const [tab, setTab] = React.useState<"login" | "register">("login");
  const user = me?.user;

  return (
    <Card className={styles.section}>
      <AuthSectionHeader user={user} tab={tab} onTabChange={setTab} />
      <CardContent className={styles.content}>
        {user ? (
          <AuthUserPanel
            user={user}
            onLogout={() => logoutMutation.mutate()}
            isLoggingOut={logoutMutation.isPending}
          />
        ) : tab === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm onSuccess={() => setTab("login")} />
        )}
      </CardContent>
    </Card>
  );
};
