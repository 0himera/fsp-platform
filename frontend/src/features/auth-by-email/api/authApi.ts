import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/entities/user";
import type { LoginFormValues, AuthSession } from "../model/types";

async function loginRequest(values: LoginFormValues): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    token: "mock-jwt-token-fsp-2026",
    user: {
      id: values.role === "organizer" ? "org-01" : "ath-01",
      email: values.email,
      role: values.role,
    },
  };
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      return data;
    },
  });
}
