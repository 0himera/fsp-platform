import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/shared/ui";
import { useCompetitionsQuery } from "@/entities/competition";
import { COMPETITION_STATUSES, COMPETITION_LEVELS } from "@/shared/config";
import styles from "./AdminCompetitionsTab.module.css";

export const AdminCompetitionsTab: React.FC = () => {
  const { data: competitions, isLoading } = useCompetitionsQuery();

  if (isLoading) return <p>Загрузка соревнований...</p>;

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Список соревнований ({competitions?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Турнир</th>
              <th className={styles.th}>Уровень</th>
              <th className={styles.th}>Статус</th>
              <th className={styles.th}>Заявок</th>
              <th className={styles.th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {competitions?.map((c) => (
              <tr key={c.id} className={styles.row}>
                <td className={styles.cell}>
                  <Link href={`/competitions/${c.id}`} className={styles.link}>
                    {c.title}
                  </Link>
                </td>
                <td className={styles.cell}>{COMPETITION_LEVELS[c.level_code] || c.level_code}</td>
                <td className={styles.cell}>
                  <Badge variant={c.status === "open" ? "default" : "secondary"}>
                    {COMPETITION_STATUSES[c.status] || c.status}
                  </Badge>
                </td>
                <td className={styles.cell}>{c.registrations_count}</td>
                <td className={styles.cell}>
                  <Link href={`/competitions/${c.id}`}>
                    <Button size="sm" variant="outline">Управление</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
