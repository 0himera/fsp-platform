import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { RankingsResponse } from "@/shared/api";


export const rankingKeys = {
  all: ["rankings"] as const,
  list: () => [...rankingKeys.all, "list"] as const,
};

export async function getRankings(): Promise<RankingsResponse> {
  return apiClient.get<RankingsResponse>("/api/rankings");
}

export function useRankingsQuery() {
  return useQuery({
    queryKey: rankingKeys.list(),
    queryFn: getRankings,
    staleTime: 1000 * 60,
  });
}
