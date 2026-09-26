"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/shared/ui";
import { useMeQuery } from "@/entities/user";
import { ProfileHeader } from "../ProfileHeader";
import { ProfileInfo } from "../ProfileInfo";
import { ProfileEditForm } from "../ProfileEditForm";
import { ProfileRegistrations } from "../ProfileRegistrations";
import styles from "./ProfileView.module.css";

export const ProfileView: React.FC = () => {
  const { data: me, isLoading } = useMeQuery();
  const [isEditing, setIsEditing] = React.useState(false);

  if (isLoading) return <div className={styles.loading}>Загрузка профиля...</div>;

  if (!me?.user) {
    return (
      <div className={styles.authNotice}>
        <Card>
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>Для доступа к личному кабинету выполните вход</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/#">
              <Button>Войти в систему</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProfileHeader user={me.user} athlete={me.athlete} />
      {isEditing ? (
        <ProfileEditForm user={me.user} athlete={me.athlete} onCancel={() => setIsEditing(false)} />
      ) : (
        <ProfileInfo user={me.user} athlete={me.athlete} onEdit={() => setIsEditing(true)} />
      )}
      <ProfileRegistrations />
    </div>
  );
};
