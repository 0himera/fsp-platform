import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { Athlete, MeResponse } from "@/shared/api";
import type { UpdateProfileInput } from "../model/types";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiClient.request<MeResponse>("/api/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me(), data);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useFeaturedAchievementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string | null) => apiClient.post<Athlete>("/api/me/featured-achievement", { code }),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.profile(data.id), data);
      queryClient.setQueryData<MeResponse>(userKeys.me(), (current) => current ? { ...current, athlete: data } : current);
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

export function useAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ ok: boolean } | { avatar_url: string }, Error, File | null>({
    mutationFn: (file: File | null) => {
      if (!file) return apiClient.delete<{ ok: boolean }>("/api/me/avatar");
      const body = new FormData();
      body.set("avatar", file);
      return apiClient.request<{ avatar_url: string }>("/api/me/avatar", { method: "PUT", body });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
