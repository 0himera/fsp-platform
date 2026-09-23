import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Athlete, MeResponse } from "@/shared/api";
import { toAthleteProfile, type AthleteProfile } from "../model/types";

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  profile: (id: string | number) =>
    [...userKeys.all, "profile", String(id)] as const,
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

export async function getAthleteProfile(
  userId?: string
): Promise<AthleteProfile> {
  if (userId && !isNaN(Number(userId))) {
    const athlete = await getAthlete(userId);
    return toAthleteProfile(athlete);
  }
  const me = await getMe();
  if (me?.athlete) {
    return toAthleteProfile(me.athlete, me.user.email);
  }
  const rankings = await apiClient.get<{ athletes: Athlete[] }>(
    "/api/rankings"
  );
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
