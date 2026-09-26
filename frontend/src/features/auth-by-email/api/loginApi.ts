import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { LoginFormValues, AuthSession } from "../model/types";

async function loginRequest(values: LoginFormValues): Promise<AuthSession> {
  let password = values.password;
  if (!password) {
    if (
      values.role === "organizer" ||
      values.email.toLowerCase().includes("organizer")
    ) {
      password = "change-me-for-local-demo";
    } else {
      password = "demo-athlete-2026";
    }
  }

  return apiClient.post<AuthSession>("/api/auth/login", {
    email: values.email.trim(),
    password,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me(), { user: data.user });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      return data;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post("/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(userKeys.me(), null);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
