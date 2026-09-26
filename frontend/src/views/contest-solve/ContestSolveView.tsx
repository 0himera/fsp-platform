"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useContestQuery, useContestSubmissionsQuery } from "@/entities/contest";
import { useContestSolve } from "./model/useContestSolve";
import { SolveLayout } from "./ui/SolveLayout";
import { SolveHeader } from "./ui/SolveHeader";
import { TaskStatementPane } from "./ui/TaskStatementPane";
import { CodeEditorPane } from "./ui/CodeEditorPane";
import { ContestLeaderboardModal } from "./ui/ContestLeaderboardModal";

export function ContestSolveView() {
  const params = useParams();
  const competitionId = Number(params?.id ?? 0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = React.useState(false);

  const { data: contest } = useContestQuery(competitionId);
  const { data: submissions = [] } = useContestSubmissionsQuery(competitionId, true);
  const tasks = contest?.tasks ?? [];

  const solve = useContestSolve(competitionId, tasks, submissions);

  return (
    <SolveLayout
      header={
        <SolveHeader
          competitionId={competitionId}
          tasks={tasks}
          selectedId={solve.selectedTaskId}
          onSelectTask={solve.setSelectedTaskId}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      }
      leftPane={<TaskStatementPane task={solve.activeTask} />}
      rightPane={
        <CodeEditorPane
          code={solve.code}
          onChangeCode={solve.setCode}
          onResetCode={solve.resetCode}
          onSubmit={solve.handleSubmit}
          submitting={solve.submitting}
          lastSubmission={solve.lastSubmission}
          submissions={solve.taskSubmissions}
          activeTab={solve.activeTab}
          onTabChange={solve.setActiveTab}
          maxPoints={solve.activeTask?.max_points}
        />
      }
      modal={
        <ContestLeaderboardModal
          competitionId={competitionId}
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      }
    />
  );
}
