import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Athlete, MeResponse } from "@/shared/api";
import { toAthleteProfile, type AthleteProfile } from "../model/types";

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  profile: (id: string | number) => [...userKeys.all, "profile", String(id)] as const,
  registrations: () => [...userKeys.all, "registrations"] as const,
};

export async function getMe(): Promise<MeResponse | null> {
  try {
    return await apiClient.get<MeResponse>("/api/me");
  } catch {
    return null;
  }
}

export function useMeQuery() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getMe,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export async function getAthlete(id: string | number): Promise<Athlete> {
  return apiClient.get<Athlete>(`/api/athletes/${id}`);
}

export function useAthleteQuery(id: string | number) {
  return useQuery({
    queryKey: userKeys.profile(id),
    queryFn: () => getAthlete(id),
    enabled: Boolean(id),
  });
}

export async function getAthleteProfile(userId?: string): Promise<AthleteProfile> {
  if (userId && !isNaN(Number(userId))) {
    const athlete = await getAthlete(userId);
    return toAthleteProfile(athlete);
  }

  // If no user specified or non-numeric id, try getting current user's profile
  const me = await getMe();
  if (me?.athlete) {
    return toAthleteProfile(me.athlete, me.user.email);
  }

  // Fallback to top-1 athlete from rankings
  const rankings = await apiClient.get<{ athletes: Athlete[] }>("/api/rankings");
  if (rankings.athletes && rankings.athletes.length > 0) {
    return toAthleteProfile(rankings.athletes[0]);
  }

  throw new Error("Спортсмен не найден");
}

export function useAthleteProfile(userId?: string) {
  return useQuery({
    queryKey: userId ? userKeys.profile(userId) : userKeys.profile("default"),
    queryFn: () => getAthleteProfile(userId),
    staleTime: 1000 * 60,
  });
}

export interface UpdateProfileInput {
  full_name: string;
  organization: string;
  city: string;
  disciplines: string[];
}

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

export function useUpdateRankMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ athleteId, rankCode }: { athleteId: string | number; rankCode: string }) =>
      apiClient.patch<Athlete>(`/api/athletes/${athleteId}/rank`, {
        rank_code: rankCode,
      }),
    onSuccess: (data, { athleteId }) => {
      queryClient.setQueryData(userKeys.profile(athleteId), data);
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
