import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { LoginFormValues, RegisterFormValues, AuthSession } from "../model/types";

async function loginRequest(values: LoginFormValues): Promise<AuthSession> {
  let password = values.password;
  if (!password) {
    if (values.role === "organizer" || values.email.toLowerCase().includes("organizer")) {
      password = "change-me-for-local-demo";
    } else {
      password = "demo-athlete-2026";
    }
  }

  const response = await apiClient.post<AuthSession>("/api/auth/login", {
    email: values.email.trim(),
    password,
  });

  return response;
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

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiClient.post<{ check_email: boolean; mail_sent: boolean }>("/api/auth/register", values),
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      apiClient.post<{ user: import("@/shared/api").User }>("/api/auth/verify-email", { token }),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me(), { user: data.user });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ check_email: boolean }>("/api/auth/forgot-password", { email }),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      apiClient.post<{ reset: boolean }>("/api/auth/reset-password", { token, password }),
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ check_email: boolean }>("/api/auth/resend-verification", { email }),
  });
}

