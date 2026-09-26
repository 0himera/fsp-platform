"use client";

import * as React from "react";
import { useSubmitCodeMutation } from "@/entities/contest";
import type { ContestTask, ContestSubmission } from "@/shared/api";
import { getStarterCode } from "./starterCode";
import type { BottomTab } from "./types";

export function useContestSolve(competitionId: number, tasks: ContestTask[], submissions: ContestSubmission[]) {
  const [selectedId, setSelectedId] = React.useState<number>(0);
  const [codeMap, setCodeMap] = React.useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = React.useState<BottomTab>("result");
  const [lastSubmission, setLastSubmission] = React.useState<ContestSubmission>();
  const submitMutation = useSubmitCodeMutation(competitionId);

  const activeTask = tasks.find((t) => t.id === selectedId) ?? tasks[0];
  const activeTaskId = activeTask?.id ?? 0;
  const code = codeMap[activeTaskId] ?? getStarterCode(activeTask);

  const taskSubmissions = React.useMemo(
    () => submissions.filter((s) => s.task_id === activeTaskId),
    [submissions, activeTaskId]
  );

  const handleSubmit = () => {
    if (!activeTaskId || submitMutation.isPending) return;
    submitMutation.mutate(
      { taskId: activeTaskId, language: "python", sourceCode: code },
      { onSuccess: (sub) => { setLastSubmission(sub); setActiveTab("result"); } }
    );
  };

  return {
    activeTask,
    selectedTaskId: activeTaskId,
    setSelectedTaskId: setSelectedId,
    code,
    setCode: (c: string) => setCodeMap((prev) => ({ ...prev, [activeTaskId]: c })),
    resetCode: () => setCodeMap((prev) => ({ ...prev, [activeTaskId]: getStarterCode(activeTask) })),
    submitting: submitMutation.isPending,
    submitError: submitMutation.error,
    handleSubmit,
    lastSubmission: lastSubmission ?? taskSubmissions[0],
    taskSubmissions,
    activeTab,
    setActiveTab,
  };
}
