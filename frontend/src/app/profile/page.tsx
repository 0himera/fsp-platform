"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
} from "@/shared/ui";
import { useMeQuery, useUpdateProfileMutation } from "@/entities/user";
import { useMyRegistrationsQuery, useUnregisterCompetitionMutation } from "@/entities/competition";
import { useDisciplinesQuery } from "@/entities/discipline";
import { SPORT_RANKS_MAP, COMPETITION_STATUSES, COMPETITION_LEVELS } from "@/shared/config";

export default function ProfilePage() {
  const router = useRouter();
  const { data: me, isLoading } = useMeQuery();
  const { data: myRegistrations } = useMyRegistrationsQuery();
  const { data: disciplines } = useDisciplinesQuery();

  const updateProfileMutation = useUpdateProfileMutation();
  const unregisterMutation = useUnregisterCompetitionMutation();

  const user = me?.user;
  const athlete = me?.athlete;

  // Edit form state
  const [fullName, setFullName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [selectedDisciplines, setSelectedDisciplines] = React.useState<string[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setCity(user.city || "");
      setOrganization(user.organization || "");
    }
    if (athlete) {
      setSelectedDisciplines(athlete.disciplines || []);
    }
  }, [user, athlete]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <p>Загрузка личного кабинета...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <Card>
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Для просмотра личного кабинета войдите в свой аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/#")}>Войти в систему</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggleDiscipline = (name: string) => {
    if (selectedDisciplines.includes(name)) {
      setSelectedDisciplines(selectedDisciplines.filter((d) => d !== name));
    } else {
      if (selectedDisciplines.length < 5) {
        setSelectedDisciplines([...selectedDisciplines, name]);
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(
      {
        full_name: fullName.trim(),
        city: city.trim(),
        organization: organization.trim(),
        disciplines: selectedDisciplines,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <main style={{ maxWidth: "1100px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Top Banner / Summary */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <Badge variant="default">
                  {user.role === "organizer" ? "Организатор" : "Спортсмен сборной"}
                </Badge>
                {athlete && (
                  <Badge variant="outline">
                    {SPORT_RANKS_MAP[athlete.rank_code] || athlete.rank_code || "Без разряда"}
                  </Badge>
                )}
              </div>
              <CardTitle style={{ fontSize: "1.75rem" }}>{user.full_name || user.email}</CardTitle>
              <CardDescription style={{ fontSize: "0.95rem" }}>
                {user.email} · {[user.city, user.organization].filter(Boolean).join(" · ") || "Республика Дагестан"}
              </CardDescription>
            </div>

            <div>
              <Button
                variant={isEditing ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Скрыть редактирование" : "Редактировать профиль"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isEditing && (
          <CardContent style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1.5rem" }}>
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    ФИО *
                  </label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Город / Населённый пункт
                  </label>
                  <Input
                    value={city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Образовательная организация / ВУЗ
                  </label>
                  <Input
                    value={organization}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrganization(e.target.value)}
                  />
                </div>
              </div>

              {disciplines && disciplines.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Профильные дисциплины (до 5):
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {disciplines.map((d) => {
                      const isSelected = selectedDisciplines.includes(d.name);
                      return (
                        <Button
                          key={d.code}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleDiscipline(d.name)}
                        >
                          {d.name} {isSelected ? "✓" : "+"}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {updateProfileMutation.isError && (
                <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                  {updateProfileMutation.error instanceof Error
                    ? updateProfileMutation.error.message
                    : "Ошибка обновления профиля"}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Arena 2.0 Rating Metrics (if athlete) */}
      {athlete && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
            Рейтинг arena-2 (Республика Дагестан)
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
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Текущее место в РД</div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#60a5fa" }}>
                  #{athlete.rating_place}
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.25)" }}>
              <CardContent style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Итоговые баллы (R)</div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#34d399" }}>
                  {athlete.rating.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Баллы турниров (R_res)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                  {athlete.result_points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Бонус разряда (R_rank)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                  +{athlete.rank_points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
                  База: {athlete.rank_base} · k_act: {athlete.activity_factor}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Section: My Registrations */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardHeader>
          <CardTitle>Мои заявки на соревнования ({myRegistrations?.length || 0})</CardTitle>
          <CardDescription>
            Турниры, на участие в которых вы подали заявку
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!myRegistrations || myRegistrations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0", opacity: 0.7 }}>
              <p>У вас пока нет активных заявок.</p>
              <Button
                variant="outline"
                size="sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => router.push("/#competitions")}
              >
                Выбрать соревнование в календаре
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {myRegistrations.map((comp) => (
                <div
                  key={comp.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                      <Badge variant={comp.status === "open" ? "default" : "secondary"}>
                        {COMPETITION_STATUSES[comp.status] || comp.status}
                      </Badge>
                      <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        {COMPETITION_LEVELS[comp.level_code] || comp.level_code}
                      </span>
                    </div>
                    <a
                      href={`/competitions/${comp.id}`}
                      style={{ fontSize: "1.1rem", fontWeight: 600, color: "#3b82f6", textDecoration: "none" }}
                    >
                      {comp.title}
                    </a>
                    <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
                      {new Date(comp.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · {comp.location || "Онлайн"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <a href={`/competitions/${comp.id}`}>
                      <Button variant="outline" size="sm">
                        Страница турнира
                      </Button>
                    </a>
                    {comp.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={unregisterMutation.isPending}
                        onClick={() => unregisterMutation.mutate(comp.id)}
                      >
                        Отозвать заявку
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section: Tournament Results History */}
      {athlete && athlete.results && athlete.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История турниров и учёт баллов</CardTitle>
            <CardDescription>
              Расшифровка формулы arena-2 по каждому результату
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", opacity: 0.7 }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Турнир</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Место</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Сетка</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>База</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Коэфф.</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Спад</th>
                    <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Баллы</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Статус</th>
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
                        {r.place_factor.toFixed(2)} · {r.size_factor.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{(r.decay * 100).toFixed(0)}%</td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#34d399" }}>
                        {r.points.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {r.included ? (
                          <Badge variant="default">В топе</Badge>
                        ) : (
                          <Badge variant="outline">Вне топа</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
