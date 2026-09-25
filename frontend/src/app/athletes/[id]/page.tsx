"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAthleteQuery, useMeQuery, useUpdateRankMutation } from "@/entities/user";
import { SPORT_RANKS_MAP } from "@/shared/config";
import { Button } from "@/shared/ui";
import { AthleteProfileView } from "@/views/athlete-profile";
import styles from "./athlete-page.module.css";

const RANK_OPTIONS = ["none", "III", "II", "I", "KMS", "MS", "MSMK", "ZMS"];

export default function AthletePublicPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: athlete, isLoading, error } = useAthleteQuery(id);
  const { data: me } = useMeQuery();
  const updateRankMutation = useUpdateRankMutation();
  const [selectedRank, setSelectedRank] = React.useState("none");

  React.useEffect(() => {
    if (athlete) setSelectedRank(athlete.rank_code || "none");
  }, [athlete]);

  if (isLoading) return <main className={styles.message}>Загружаем профиль спортсмена…</main>;
  if (error || !athlete) {
    return <main className={styles.messageCard}><h1>Профиль не найден</h1><p>{error instanceof Error ? error.message : "Спортсмен отсутствует в рейтинговой системе."}</p><Link href="/rankings">← Вернуться к рейтингу</Link></main>;
  }

  const rankEditor = me?.user.role === "organizer" ? (
    <details className={styles.rankEditor}>
      <summary>Подтвердить спортивный разряд</summary>
      <div className={styles.rankForm}>
        <label htmlFor="athlete-rank">Спортивный разряд</label>
        <select id="athlete-rank" value={selectedRank} onChange={(event) => setSelectedRank(event.target.value)}>
          {RANK_OPTIONS.map((rank) => <option value={rank} key={rank}>{SPORT_RANKS_MAP[rank] || rank}</option>)}
        </select>
        <Button size="sm" disabled={updateRankMutation.isPending} onClick={() => updateRankMutation.mutate({ athleteId: id, rankCode: selectedRank })}>
          {updateRankMutation.isPending ? "Сохраняем…" : "Сохранить разряд"}
        </Button>
        {updateRankMutation.isError && <span className={styles.error}>{updateRankMutation.error.message}</span>}
      </div>
    </details>
  ) : undefined;

  return <AthleteProfileView athlete={athlete} rankEditor={rankEditor} />;
}
