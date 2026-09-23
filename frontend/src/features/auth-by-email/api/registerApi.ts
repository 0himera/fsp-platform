import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { RegisterFormValues } from "../model/types";
import type { User } from "@/shared/api";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiClient.post<{ check_email: boolean; mail_sent: boolean }>(
        "/api/auth/register",
        values
      ),
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      apiClient.post<{ user: User }>("/api/auth/verify-email", { token }),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me(), { user: data.user });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ check_email: boolean }>(
        "/api/auth/resend-verification",
        { email }
      ),
  });
}
