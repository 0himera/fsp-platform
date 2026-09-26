import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { AiMessage, AiChatResponse } from "@/shared/api";

export function useAiChatMutation() {
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: AiMessage[] }) =>
      apiClient.post<AiChatResponse>("/api/ai/chat", {
        message,
        history,
      }),
  });
}
