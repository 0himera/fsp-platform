import * as React from "react";
import { Card, CardHeader, CardContent, Button, Badge } from "@/shared/ui";
import { SPORT_RANKS_MAP } from "@/shared/config";
import type { Athlete } from "@/shared/api";
import { AthleteStatsRow } from "../AthleteStatsRow";
import styles from "./AthleteDetailHeader.module.css";

interface AthleteDetailHeaderProps {
  athlete: Athlete;
  isOrganizer: boolean;
  onOpenRankModal: () => void;
}

export const AthleteDetailHeader: React.FC<AthleteDetailHeaderProps> = ({
  athlete,
  isOrganizer,
  onOpenRankModal,
}) => {
  const rank = athlete.rank_code ? SPORT_RANKS_MAP[athlete.rank_code] : "Без разряда";

  return (
    <Card className={styles.headerCard}>
      <CardHeader>
        <div className={styles.topRow}>
          <div>
            <div className={styles.titleArea}>
              <h1 className={styles.name}>{athlete.full_name}</h1>
              <Badge variant="outline">{rank}</Badge>
            </div>
            <p className={styles.meta}>{athlete.city} · {athlete.organization}</p>
            <div className={styles.disciplines}>
              {athlete.disciplines?.map((d) => (
                <Badge key={d} variant="secondary">{d}</Badge>
              ))}
            </div>
          </div>
          {isOrganizer && (
            <Button size="sm" variant="outline" onClick={onOpenRankModal}>
              Изменить разряд
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AthleteStatsRow athlete={athlete} />
      </CardContent>
    </Card>
  );
};
