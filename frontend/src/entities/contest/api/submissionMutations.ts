import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { ContestSubmission } from "@/shared/api";
import { useRefreshContest } from "./refresh";

export function useSubmitCodeMutation(id: number) {
  const refresh = useRefreshContest(id);
  return useMutation({
    mutationFn: ({ taskId, language, sourceCode }: { taskId: number; language: string; sourceCode: string }) =>
      apiClient.post<ContestSubmission>(`/api/competitions/${id}/contest/tasks/${taskId}/submissions`, { language, source_code: sourceCode }),
    onSuccess: refresh,
  });
}

export function useSubmitCSVMutation(id: number) {
  const refresh = useRefreshContest(id);
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: number; file: File }) => {
      const body = new FormData();
      body.set("file", file);
      return apiClient.request<ContestSubmission>(`/api/competitions/${id}/contest/tasks/${taskId}/csv-submissions`, { method: "POST", body });
    },
    onSuccess: refresh,
  });
}

export function useReviewContestSubmissionMutation(id: number) {
  const refresh = useRefreshContest(id);
  return useMutation({
    mutationFn: ({ submissionId, score, feedback }: { submissionId: number; score: number; feedback: string }) =>
      apiClient.patch(`/api/competitions/${id}/contest/submissions/${submissionId}/review`, { score, feedback }),
    onSuccess: refresh,
  });
}

export function useFinalizeContestMutation(id: number) {
  const refresh = useRefreshContest(id);
  return useMutation({
    mutationFn: () => apiClient.post(`/api/competitions/${id}/contest/finalize`),
    onSuccess: refresh,
  });
}
