"use client";

import type { Competition } from "@/shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useContestQuery } from "@/entities/contest";
import { CloseRegistrationControl } from "./ui/CloseRegistrationControl";
import { StartEarlyControl } from "./ui/StartEarlyControl";
import styles from "./CompetitionLifecycleControls.module.css";

interface Props {
  competition: Competition;
}

export function CompetitionLifecycleControls({ competition }: Props) {
  const contest = useContestQuery(competition.id);

  if (competition.format !== "individual") return null;

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Управление этапами</CardTitle>
      </CardHeader>
      <CardContent className={styles.content}>
        <CloseRegistrationControl competition={competition} />
        <StartEarlyControl
          competition={competition}
          hasTasks={Boolean(contest.data?.tasks?.length)}
          isLoadingContest={contest.isLoading}
        />
      </CardContent>
    </Card>
  );
}
