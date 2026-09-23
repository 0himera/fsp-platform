"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui";
import { LoginForm } from "@/features/auth-by-email";
import styles from "./AuthSection.module.css";

export const AuthSection: React.FC = () => {
  return (
    <Card className={styles.section}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.heading}>Авторизация в системе</CardTitle>
        <CardDescription className={styles.description}>
          Быстрый вход для спортсменов сборной и организаторов соревнований
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.content}>
        <LoginForm />
      </CardContent>
    </Card>
  );
};

export default AuthSection;
