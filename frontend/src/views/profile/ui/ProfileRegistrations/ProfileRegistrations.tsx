import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/shared/ui";
import { useMyRegistrationsQuery } from "@/entities/competition";
import { useUnregisterCompetitionMutation } from "@/features/register-competition";
import { COMPETITION_STATUSES } from "@/shared/config";
import styles from "./ProfileRegistrations.module.css";

export const ProfileRegistrations: React.FC = () => {
  const { data: myRegistrations, isLoading } = useMyRegistrationsQuery();
  const unregisterMutation = useUnregisterCompetitionMutation();

  if (isLoading) return <p>Загрузка заявок...</p>;

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Мои заявки на турниры</CardTitle>
      </CardHeader>
      <CardContent>
        {!myRegistrations || myRegistrations.length === 0 ? (
          <p className={styles.empty}>У вас пока нет активных заявок</p>
        ) : (
          <div className={styles.list}>
            {myRegistrations.map((comp) => (
              <div key={comp.id} className={styles.item}>
                <div>
                  <Link href={`/competitions/${comp.id}`} className={styles.itemTitle}>
                    {comp.title}
                  </Link>
                  <p className={styles.itemMeta}>
                    {new Date(comp.starts_at).toLocaleDateString("ru-RU")} · {comp.location}
                  </p>
                </div>
                <div className={styles.rightGroup}>
                  <Badge variant={comp.status === "open" ? "default" : "secondary"}>
                    {COMPETITION_STATUSES[comp.status] || comp.status}
                  </Badge>
                  {comp.status === "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unregisterMutation.mutate(comp.id)}
                      disabled={unregisterMutation.isPending}
                    >
                      Отозвать
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
