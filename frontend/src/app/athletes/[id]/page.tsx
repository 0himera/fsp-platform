"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/shared/ui";
import { useAthleteQuery, useMeQuery, useUpdateRankMutation } from "@/entities/user";
import { SPORT_RANKS_MAP } from "@/shared/config";

const RANK_OPTIONS = [
  { code: "none", label: "Без разряда" },
  { code: "III", label: "III спортивный разряд" },
  { code: "II", label: "II спортивный разряд" },
  { code: "I", label: "I спортивный разряд" },
  { code: "KMS", label: "Кандидат в мастера спорта (КМС)" },
  { code: "MS", label: "Мастер спорта России (МС)" },
  { code: "MSMK", label: "МСМК" },
  { code: "ZMS", label: "ЗМС" },
];

export default function AthletePublicPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: athlete, isLoading, error } = useAthleteQuery(id);
  const { data: me } = useMeQuery();
  const updateRankMutation = useUpdateRankMutation();

  const [selectedRank, setSelectedRank] = React.useState<string>("none");
  const [showRankModal, setShowRankModal] = React.useState(false);

  const isOrganizer = me?.user?.role === "organizer";

  React.useEffect(() => {
    if (athlete) {
      setSelectedRank(athlete.rank_code || "none");
    }
  }, [athlete]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <p>Загрузка карточки спортсмена...</p>
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div style={{ maxWidth: "800px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <Card>
          <CardHeader>
            <CardTitle>Спортсмен не найден</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Профиль спортсмена отсутствует в рейтинговой системе."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/#ratings")}>К таблице рейтинга</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveRank = () => {
    updateRankMutation.mutate(
      { athleteId: id, rankCode: selectedRank },
      {
        onSuccess: () => setShowRankModal(false),
      }
    );
  };

  return (
    <main style={{ maxWidth: "1100px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <a
          href="/#ratings"
          style={{ textDecoration: "none", color: "#3b82f6", fontSize: "0.875rem" }}
        >
          ← Назад к рейтингу Республики Дагестан
        </a>
      </div>

      {/* Main Profile Header */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <Badge variant="outline">Спортсмен РД</Badge>
                <Badge variant="default">
                  {SPORT_RANKS_MAP[athlete.rank_code] || athlete.rank_code || "Без разряда"}
                </Badge>
              </div>
              <CardTitle style={{ fontSize: "1.85rem" }}>{athlete.full_name}</CardTitle>
              <CardDescription style={{ fontSize: "1rem", marginTop: "0.25rem" }}>
                {[athlete.city, athlete.organization].filter(Boolean).join(" · ") || "Республика Дагестан"}
              </CardDescription>

              {athlete.disciplines && athlete.disciplines.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {athlete.disciplines.map((d) => (
                    <Badge key={d} variant="secondary">
                      {d}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer controls: change sports rank */}
            {isOrganizer && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRankModal(!showRankModal)}
                >
                  {showRankModal ? "Скрыть" : "Присвоить / подтвердить разряд"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Organizer Rank Modal / Panel */}
        {showRankModal && isOrganizer && (
          <CardContent style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1.25rem" }}>
            <div style={{ maxWidth: "450px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Установить спортивный разряд ФСП:
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "6px",
                  background: "#18181b",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
              >
                {RANK_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {updateRankMutation.isError && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>
                  Ошибка присвоения разряда.
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  size="sm"
                  disabled={updateRankMutation.isPending}
                  onClick={handleSaveRank}
                >
                  {updateRankMutation.isPending ? "Сохранение..." : "Подтвердить разряд"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRankModal(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Arena 2.0 Metrics */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Показатели в рейтинге Федерации (arena-2)
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <Card style={{ background: "rgba(59, 130, 246, 0.08)", borderColor: "rgba(59, 130, 246, 0.25)" }}>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Место в рейтинге РД</div>
              <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "#60a5fa" }}>
                #{athlete.rating_place}
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.25)" }}>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Суммарный рейтинг (R)</div>
              <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "#34d399" }}>
                {athlete.rating.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Турнирные очки (R_res)</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
                {athlete.result_points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
                Учитываются 4 лучших старта
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Бонус за разряд (R_rank)</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
                +{athlete.rank_points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
                База: {athlete.rank_base} · k_act: {athlete.activity_factor}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tournament History */}
      <Card>
        <CardHeader>
          <CardTitle>История выступлений и учёт баллов</CardTitle>
          <CardDescription>
            Турниры, включённые в формулу расчёта arena-2 с учётом масштаба сетки и спада давности
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!athlete.results || athlete.results.length === 0 ? (
            <p style={{ opacity: 0.7 }}>У спортсмена пока нет зафиксированных результатов в турнирах</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", opacity: 0.7 }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Турнир</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Место</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Финишировало</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>База турнира</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Множители</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Спад давности</th>
                    <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Итоговые баллы</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Учёт в R</th>
                  </tr>
                </thead>
                <tbody>
                  {athlete.results.map((r, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        opacity: r.included ? 1 : 0.6,
                      }}
                    >
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <a
                          href={`/competitions/${r.competition_id}`}
                          style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}
                        >
                          {r.competition}
                        </a>
                        <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{r.discipline}</div>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                        {r.place}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{r.finishers}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{r.base}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        k_place: {r.place_factor.toFixed(2)}, k_size: {r.size_factor.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{(r.decay * 100).toFixed(0)}%</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#34d399" }}>
                        {r.points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {r.included ? (
                          <Badge variant="default">Топ-4</Badge>
                        ) : (
                          <Badge variant="outline">Вне топа</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
