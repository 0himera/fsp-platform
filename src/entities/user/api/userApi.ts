import { useQuery } from "@tanstack/react-query";
import type { AthleteProfile } from "../model/types";

export const userKeys = {
  all: ["users"] as const,
  profile: (id: string) => [...userKeys.all, "profile", id] as const,
  rating: () => [...userKeys.all, "rating"] as const,
};

const mockAthlete: AthleteProfile = {
  id: "ath-01",
  fullName: "Магомедов Шамиль Рашидович",
  email: "shamil.magomedov@fsp-rd.ru",
  role: "athlete",
  organization: "Дагестанский государственный технический университет (ДГТУ)",
  city: "Махачкала",
  disciplines: [
    "Программирование продуктовое",
    "Программирование алгоритмическое",
  ],
  rank: "I спортивный разряд",
  rating: 1840,
  regionalRank: 3,
  competitions: [
    {
      id: "comp-1",
      name: "Кубок Республики Дагестан 2025",
      level: "Региональный",
      discipline: "Программирование продуктовое",
      date: "2025-11-14",
      place: 1,
      pointsEarned: 450,
    },
    {
      id: "comp-2",
      name: "Чемпионат СКФО по спортивному программированию",
      level: "Межрегиональный",
      discipline: "Программирование алгоритмическое",
      date: "2025-05-20",
      place: 2,
      pointsEarned: 380,
    },
  ],
};

export async function getAthleteProfile(userId: string): Promise<AthleteProfile> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { ...mockAthlete, id: userId };
}

export function useAthleteProfile(userId: string = "ath-01") {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => getAthleteProfile(userId),
  });
}
