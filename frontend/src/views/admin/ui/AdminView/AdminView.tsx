"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/shared/ui";
import { useMeQuery } from "@/entities/user";
import { AdminHeader, type AdminTab } from "../AdminHeader";
import { AdminCompetitionsTab } from "../AdminCompetitionsTab";
import { AdminCreateTab } from "../AdminCreateTab";
import { AdminDisciplinesTab } from "../AdminDisciplinesTab";
import styles from "./AdminView.module.css";

export const AdminView: React.FC = () => {
  const { data: me, isLoading } = useMeQuery();
  const [tab, setTab] = React.useState<AdminTab>("competitions");

  if (isLoading) return <div className={styles.loading}>Проверка прав...</div>;

  if (me?.user?.role !== "organizer") {
    return (
      <div className={styles.authNotice}>
        <Card>
          <CardHeader>
            <CardTitle>Доступ ограничен</CardTitle>
            <CardDescription>Панель организатора доступна только для роли organizer</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/#"><Button>На главную</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminHeader currentTab={tab} onTabChange={setTab} />
      {tab === "competitions" && <AdminCompetitionsTab />}
      {tab === "create" && <AdminCreateTab onSuccess={() => setTab("competitions")} />}
      {tab === "disciplines" && <AdminDisciplinesTab />}
    </div>
  );
};
