import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Athlete } from "@/shared/api";
import { toAthleteProfile, type AthleteProfile } from "../model/types";
import { getMe, getAthlete, userKeys } from "./userApi";

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
