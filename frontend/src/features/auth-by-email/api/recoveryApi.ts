import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ check_email: boolean }>("/api/auth/forgot-password", {
        email,
      }),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) =>
      apiClient.post<{ reset: boolean }>("/api/auth/reset-password", {
        token,
        password,
      }),
  });
}
