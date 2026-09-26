"use client";

import type { Competition } from "@/shared/api";
import { ApiError } from "@/shared/api";
import { Card, CardHeader, CardTitle } from "@/shared/ui";
import { useContestQuery } from "@/entities/contest";
import { ContestCreateForm } from "./ui/ContestCreateForm";
import { ContestBody } from "./ui/ContestBody";
import styles from "./ContestPanel.module.css";

interface Props {
  competition: Competition;
  isOrganizer: boolean;
  isRegistered: boolean;
  canRegister?: boolean;
  onRegister?: () => void;
  isRegisterPending?: boolean;
}

export function ContestPanel(props: Props) {
  const { competition, isOrganizer } = props;
  const contestQuery = useContestQuery(competition.id);
  const isNotConfigured = contestQuery.error instanceof ApiError && contestQuery.error.status === 404;

  if (competition.format !== "individual" || contestQuery.isLoading) return null;
  if (isNotConfigured && !isOrganizer) return null;

  return (
    <section className={styles.section}>
      <Card>
        <CardHeader><CardTitle>Контест на платформе</CardTitle></CardHeader>
        <div className={styles.body}>
          {isNotConfigured && isOrganizer && <ContestCreateForm competitionId={competition.id} />}
          {contestQuery.data && <ContestBody contest={contestQuery.data} {...props} />}
        </div>
      </Card>
    </section>
  );
}
