"use client";

import type { Competition, Contest } from "@/shared/api";
import { useContestLeaderboardQuery, useContestSubmissionsQuery } from "@/entities/contest";
import { ContestHeader } from "../ContestHeader";
import { ContestAddTaskForm } from "../ContestAddTaskForm";
import { ContestTaskList } from "../ContestTaskList";
import { ContestSubmissionsList } from "../ContestSubmissionsList";
import { ContestLeaderboard } from "../ContestLeaderboard";
import { ContestFinalizeBox } from "../ContestFinalizeBox";
import styles from "./ContestBody.module.css";

interface Props {
  contest: Contest;
  competition: Competition;
  isOrganizer: boolean;
  isRegistered: boolean;
  canRegister?: boolean;
  onRegister?: () => void;
  isRegisterPending?: boolean;
}

export function ContestBody({ contest, competition, isOrganizer, ...props }: Props) {
  const id = competition.id;
  const submissionsQuery = useContestSubmissionsQuery(id, Boolean(isOrganizer || props.isRegistered));
  const leaderboardQuery = useContestLeaderboardQuery(id, Boolean(isOrganizer || competition.status === "completed"));
  const isEnded = competition.status === "completed" || competition.phase === "awaiting_results" || competition.phase === "completed";
  const isUpcoming = competition.phase === "upcoming";
  const canSubmitNow = !isEnded && !isUpcoming && !contest.finalized;

  return (
    <>
      <ContestHeader contest={contest} isOrganizer={isOrganizer} isUpcoming={isUpcoming} />
      {isOrganizer && !contest.finalized && !isEnded && <ContestAddTaskForm competitionId={id} mode={contest.mode} />}
      {contest.tasks.length === 0 ? (
        <p className={styles.empty}>{isOrganizer ? "Добавьте задания контеста." : "Задания пока недоступны."}</p>
      ) : (
        <ContestTaskList
          competitionId={id}
          tasks={contest.tasks}
          mode={contest.mode}
          isOrganizer={isOrganizer}
          canSubmitNow={canSubmitNow}
          isUpcoming={isUpcoming}
          isEnded={isEnded}
          finalized={contest.finalized}
          {...props}
        />
      )}
      <ContestSubmissionsList competitionId={id} submissions={submissionsQuery.data ?? []} isOrganizer={isOrganizer} editable={!contest.finalized} />
      <ContestLeaderboard leaders={leaderboardQuery.data} />
      {isOrganizer && !contest.finalized && <ContestFinalizeBox competitionId={id} mayFinalize={isEnded && competition.status !== "completed"} />}
    </>
  );
}
