import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Athlete, MeResponse } from "@/shared/api";

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
