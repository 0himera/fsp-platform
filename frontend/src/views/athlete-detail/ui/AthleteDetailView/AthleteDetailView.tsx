"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";
import { useAthleteQuery, useMeQuery } from "@/entities/user";
import { AthleteDetailHeader } from "../AthleteDetailHeader";
import { AthleteResultsTable } from "../AthleteResultsTable";
import { AthleteRankModal } from "../AthleteRankModal";
import styles from "./AthleteDetailView.module.css";

export const AthleteDetailView: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;

  const { data: athlete, isLoading, error } = useAthleteQuery(id);
  const { data: me } = useMeQuery();
  const [showRankModal, setShowRankModal] = React.useState(false);

  const isOrganizer = me?.user?.role === "organizer";

  if (isLoading) return <div className={styles.loading}>Загрузка карточки спортсмена...</div>;

  if (error || !athlete) {
    return (
      <div className={styles.notFound}>
        <Card>
          <CardHeader>
            <CardTitle>Спортсмен не найден</CardTitle>
            <CardDescription>Проверьте корректность идентификатора профиля</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AthleteDetailHeader
        athlete={athlete}
        isOrganizer={isOrganizer}
        onOpenRankModal={() => setShowRankModal(true)}
      />
      <AthleteResultsTable results={athlete.results || []} />
      {showRankModal && (
        <AthleteRankModal
          athleteId={athlete.id}
          initialRank={athlete.rank_code || "none"}
          onClose={() => setShowRankModal(false)}
        />
      )}
    </div>
  );
};
