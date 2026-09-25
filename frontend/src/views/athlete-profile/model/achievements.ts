import type { AthleteResult } from "@/shared/api";

export type AchievementKind = "first" | "win" | "podium" | "final" | "series";
export interface Achievement { title: string; description: string; date?: string; kind: AchievementKind; }

export function buildAchievements(results: AthleteResult[]): Achievement[] {
  if (!results.length) return [];
  const chronological = [...results].sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  const first = chronological[0];
  const wins = chronological.filter((result) => result.points > 0 && result.place === 1 && result.stage !== "qualification");
  const podium = chronological.find((result) => result.points > 0 && result.place <= 3 && result.stage !== "qualification");
  const final = chronological.find((result) => result.stage === "final" && result.points > 0);
  const achievements: Achievement[] = [
    { title: "Первый старт", description: "Участие в официальном соревновании", date: first.ends_at, kind: "first" },
    ...(wins[0] ? [{ title: "Победа", description: wins[0].competition, date: wins[0].ends_at, kind: "win" as const }] : []),
    ...(podium ? [{ title: "Призовое место", description: podium.competition, date: podium.ends_at, kind: "podium" as const }] : []),
    ...(final ? [{ title: "Финалист", description: final.competition, date: final.ends_at, kind: "final" as const }] : []),
    ...(results.length >= 5 ? [{ title: "Пять стартов", description: `${results.length} опубликованных результатов`, date: chronological[chronological.length - 1].ends_at, kind: "series" as const }] : []),
  ];
  return achievements.slice(0, 4);
}
