import * as React from "react";
import { Card, CardHeader, CardContent, Badge } from "@/shared/ui";
import { SPORT_RANKS_MAP } from "@/shared/config";
import type { User, Athlete } from "@/shared/api";
import styles from "./ProfileHeader.module.css";

interface ProfileHeaderProps {
  user: User;
  athlete?: Athlete;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, athlete }) => {
  const rank = athlete?.rank_code ? SPORT_RANKS_MAP[athlete.rank_code] : "Без разряда";

  return (
    <Card className={styles.headerCard}>
      <CardHeader>
        <div className={styles.topRow}>
          <h1 className={styles.title}>{user.full_name || user.email}</h1>
          <Badge variant="outline">{rank}</Badge>
        </div>
        <p className={styles.meta}>{user.email} · {user.role === "organizer" ? "Организатор" : "Спортсмен"}</p>
      </CardHeader>
      {athlete && (
        <CardContent>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Место в рейтинге</span>
              <span className={styles.statValue}>№ {athlete.rating_place || "—"}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Рейтинг arena-2</span>
              <span className={styles.statValue}>{athlete.rating}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Очки за турниры</span>
              <span className={styles.statValue}>{athlete.result_points}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Бонус разряда</span>
              <span className={styles.statValue}>{athlete.rank_points}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
