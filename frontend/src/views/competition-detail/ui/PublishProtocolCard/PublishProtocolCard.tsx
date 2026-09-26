import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/shared/ui";
import { usePublishResultsMutation } from "@/features/publish-results";
import type { Competition, Registration, Team } from "@/shared/api";
import styles from "./PublishProtocolCard.module.css";

interface PublishProtocolCardProps {
  competition: Competition;
  registrations: Registration[];
  teams: Team[];
}

export const PublishProtocolCard: React.FC<PublishProtocolCardProps> = ({
  competition,
  registrations,
  teams,
}) => {
  const publishMutation = usePublishResultsMutation();
  const isTeam = competition.format === "team";
  const count = isTeam ? teams.length : registrations.length;
  const isEnded = competition.status === "completed" || competition.phase === "completed";

  const handlePublish = () => {
    const results = isTeam
      ? teams.map((t, i) => ({ team_id: t.id, place: i + 1, score_text: `${100 - i * 5} баллов` }))
      : registrations.map((r, i) => ({ athlete_id: r.athlete_id, place: i + 1, score_text: `${100 - i * 5} баллов` }));
    publishMutation.mutate({ competitionId: competition.id, results });
  };

  return (
    <Card className={styles.card}>
      <CardHeader><CardTitle>Публикация итогового протокола</CardTitle></CardHeader>
      <CardContent>
        <p className={styles.info}>
          Зачёт: <strong>{isTeam ? "Командный" : "Индивидуальный"}</strong> · Участников в списке: <strong>{count}</strong>
        </p>
        {!isEnded && (
          <p className={styles.warning}>
            Турнир ещё не завершён (до {new Date(competition.ends_at).toLocaleDateString("ru-RU")}). Протокол публикуется по окончании состязаний.
          </p>
        )}
        <Button onClick={handlePublish} disabled={publishMutation.isPending || count === 0 || !isEnded}>
          {publishMutation.isPending ? "Публикуем протокол..." : `Опубликовать протокол (${count} ${isTeam ? "команд" : "участников"})`}
        </Button>
      </CardContent>
    </Card>
  );
};
