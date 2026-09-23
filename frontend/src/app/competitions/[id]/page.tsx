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
  Input,
} from "@/shared/ui";
import {
  useCompetitionDetailQuery,
  useRegisterCompetitionMutation,
  useUnregisterCompetitionMutation,
  useUpdateCompetitionMutation,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  usePublishResultsMutation,
} from "@/entities/competition";
import { useMeQuery } from "@/entities/user";
import {
  COMPETITION_LEVELS,
  COMPETITION_STATUSES,
  COMPETITION_STAGES,
} from "@/shared/config";

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, error } = useCompetitionDetailQuery(id);
  const { data: me } = useMeQuery();

  const registerMutation = useRegisterCompetitionMutation();
  const unregisterMutation = useUnregisterCompetitionMutation();
  const updateCompetitionMutation = useUpdateCompetitionMutation();
  const createTeamMutation = useCreateTeamMutation();
  const deleteTeamMutation = useDeleteTeamMutation();
  const publishResultsMutation = usePublishResultsMutation();

  const [activeTab, setActiveTab] = React.useState<"registrations" | "teams" | "results" | "admin">("registrations");

  // Team creation form state
  const [teamName, setTeamName] = React.useState("");
  const [selectedAthletes, setSelectedAthletes] = React.useState<number[]>([]);

  // Results publish form state
  const [resultsList, setResultsList] = React.useState<
    Array<{ athlete_id?: number; team_id?: number; place: number; score_text: string }>
  >([]);

  const user = me?.user;
  const isOrganizer = user?.role === "organizer";
  const isAthlete = user?.role === "athlete";

  const competition = data?.competition;
  const registrations = data?.registrations || [];
  const teams = data?.teams || [];
  const results = data?.results || [];
  const isRegistered = data?.registered;

  // Initialize resultsList when results arrive or change
  React.useEffect(() => {
    if (results && results.length > 0) {
      setResultsList(
        results.map((r) => ({
          athlete_id: r.athlete_id || undefined,
          team_id: r.team_id || undefined,
          place: r.place,
          score_text: r.score_text || "",
        }))
      );
    }
  }, [results]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <p>Загрузка данных соревнования...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div style={{ maxWidth: "1000px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <Card>
          <CardHeader>
            <CardTitle>Соревнование не найдено</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Возможно, турнир удалён или скрыт."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/#competitions")}>Вернуться к списку</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggleAthleteForTeam = (athleteId: number) => {
    if (selectedAthletes.includes(athleteId)) {
      setSelectedAthletes(selectedAthletes.filter((id) => id !== athleteId));
    } else {
      setSelectedAthletes([...selectedAthletes, athleteId]);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || selectedAthletes.length === 0) return;
    createTeamMutation.mutate(
      { competitionId: id, name: teamName.trim(), memberIds: selectedAthletes },
      {
        onSuccess: () => {
          setTeamName("");
          setSelectedAthletes([]);
        },
      }
    );
  };

  const handleAddResultRow = () => {
    const nextPlace = resultsList.length + 1;
    setResultsList([
      ...resultsList,
      {
        place: nextPlace,
        score_text: "",
        athlete_id: competition.format === "individual" && registrations[0] ? registrations[0].athlete_id : undefined,
        team_id: competition.format === "team" && teams[0] ? teams[0].id : undefined,
      },
    ]);
  };

  const handleRemoveResultRow = (index: number) => {
    setResultsList(resultsList.filter((_, i) => i !== index));
  };

  const handleSaveResults = () => {
    publishResultsMutation.mutate({
      competitionId: id,
      results: resultsList,
    });
  };

  return (
    <main style={{ maxWidth: "1100px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Navigation breadcrumb */}
      <div style={{ marginBottom: "1.5rem" }}>
        <a
          href="/#competitions"
          style={{ textDecoration: "none", color: "#3b82f6", fontSize: "0.875rem" }}
        >
          ← Назад ко всем соревнованиям
        </a>
      </div>

      {/* Main Info Card */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardHeader>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <Badge variant={competition.status === "open" ? "default" : "secondary"}>
              {COMPETITION_STATUSES[competition.status] || competition.status}
            </Badge>
            <Badge variant="outline">
              {COMPETITION_LEVELS[competition.level_code] || competition.level_code}
            </Badge>
            <Badge variant="outline">
              {competition.format === "team" ? "Командный формат" : "Одиночный зачёт"}
            </Badge>
            {competition.stage !== "standalone" && (
              <Badge variant="secondary">
                {COMPETITION_STAGES[competition.stage] || competition.stage}
              </Badge>
            )}
          </div>

          <CardTitle style={{ fontSize: "1.75rem", lineHeight: 1.25 }}>
            {competition.title}
          </CardTitle>

          <CardDescription style={{ fontSize: "0.95rem", marginTop: "0.5rem" }}>
            Дисциплина: <strong>{competition.discipline_code}</strong> · Локация:{" "}
            <strong>{competition.location || "Онлайн"}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              background: "rgba(255, 255, 255, 0.03)",
              padding: "1.25rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Начало турнира</div>
              <div style={{ fontWeight: 600 }}>
                {new Date(competition.starts_at).toLocaleString("ru-RU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Окончание</div>
              <div style={{ fontWeight: 600 }}>
                {new Date(competition.ends_at).toLocaleString("ru-RU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Дедлайн подачи заявок</div>
              <div style={{ fontWeight: 600 }}>
                {new Date(competition.registration_deadline).toLocaleString("ru-RU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Подано заявок</div>
              <div style={{ fontWeight: 600, fontSize: "1.2rem" }}>
                {competition.registrations_count}
              </div>
            </div>
          </div>

          {competition.description && (
            <div style={{ marginBottom: "1.5rem", whiteSpace: "pre-line", lineHeight: 1.6 }}>
              {competition.description}
            </div>
          )}

          {/* Registration Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem",
              background: "rgba(59, 130, 246, 0.08)",
              borderRadius: "8px",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              {isRegistered ? (
                <div>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>
                    ✓ Вы зарегистрированы на этот турнир
                  </span>
                  <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                    Ваша заявка принята организаторами
                  </div>
                </div>
              ) : competition.registration_open ? (
                <div>
                  <span style={{ fontWeight: 600 }}>Регистрация открыта</span>
                  <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                    Подайте заявку до дедлайна регистрации
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ opacity: 0.8, fontWeight: 500 }}>
                    Регистрация на турнир в данный момент недоступна
                  </span>
                </div>
              )}
            </div>

            <div>
              {isAthlete && (
                <>
                  {isRegistered ? (
                    <Button
                      variant="outline"
                      disabled={unregisterMutation.isPending}
                      onClick={() => unregisterMutation.mutate(competition.id)}
                    >
                      {unregisterMutation.isPending ? "Отмена..." : "Отменить заявку"}
                    </Button>
                  ) : competition.registration_open ? (
                    <Button
                      disabled={registerMutation.isPending}
                      onClick={() => registerMutation.mutate(competition.id)}
                    >
                      {registerMutation.isPending ? "Отправка..." : "Подать заявку на участие"}
                    </Button>
                  ) : null}
                </>
              )}

              {!user && (
                <a href="/#">
                  <Button>Войти для подачи заявки</Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: "1.5rem" }}>
        <Button
          variant={activeTab === "registrations" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("registrations")}
        >
          Заявки ({registrations.length})
        </Button>
        {competition.format === "team" && (
          <Button
            variant={activeTab === "teams" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("teams")}
          >
            Команды ({teams.length})
          </Button>
        )}
        <Button
          variant={activeTab === "results" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("results")}
        >
          Итоговый протокол ({results.length})
        </Button>
        {isOrganizer && (
          <Button
            variant={activeTab === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("admin")}
          >
            Управление турниром
          </Button>
        )}
      </div>

      {/* Tab: Registrations */}
      {activeTab === "registrations" && (
        <Card>
          <CardHeader>
            <CardTitle>Список зарегистрированных участников ({registrations.length})</CardTitle>
            <CardDescription>
              Спортсмены, подавшие заявку на участие в турнире
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <p style={{ opacity: 0.7 }}>Пока никто не зарегистрировался</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.875rem", opacity: 0.7 }}>
                      <th style={{ padding: "0.75rem 0.5rem", width: "40px" }}>№</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Спортсмен</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Организация</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Город</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Дата подачи</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, idx) => (
                      <tr
                        key={reg.athlete_id}
                        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
                      >
                        <td style={{ padding: "0.75rem 0.5rem", opacity: 0.7 }}>{idx + 1}</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <a
                            href={`/athletes/${reg.athlete_id}`}
                            style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}
                          >
                            {reg.full_name}
                          </a>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", opacity: 0.8 }}>{reg.organization || "—"}</td>
                        <td style={{ padding: "0.75rem 0.5rem", opacity: 0.8 }}>{reg.city || "—"}</td>
                        <td style={{ padding: "0.75rem 0.5rem", opacity: 0.7, fontSize: "0.875rem" }}>
                          {new Date(reg.created_at).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Teams */}
      {activeTab === "teams" && competition.format === "team" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card>
            <CardHeader>
              <CardTitle>Сформированные команды ({teams.length})</CardTitle>
              <CardDescription>
                Составы команд для участия в командном зачёте
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p style={{ opacity: 0.7 }}>Команды ещё не сформированы</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {teams.map((team) => (
                    <Card key={team.id} style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                      <CardHeader style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <CardTitle style={{ fontSize: "1.1rem" }}>{team.name}</CardTitle>
                          {isOrganizer && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deleteTeamMutation.isPending}
                              onClick={() =>
                                deleteTeamMutation.mutate({ competitionId: id, teamId: team.id })
                              }
                            >
                              Удалить
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                          Состав ({team.members?.length || 0}):
                        </div>
                        <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.875rem" }}>
                          {team.members?.map((m) => (
                            <li key={m.athlete_id} style={{ marginBottom: "0.25rem" }}>
                              <a
                                href={`/athletes/${m.athlete_id}`}
                                style={{ color: "#3b82f6", textDecoration: "none" }}
                              >
                                {m.full_name}
                              </a>{" "}
                              <span style={{ opacity: 0.6 }}>({m.city || m.organization})</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizer: Create Team Form */}
          {isOrganizer && (
            <Card>
              <CardHeader>
                <CardTitle>Создать команду</CardTitle>
                <CardDescription>
                  Объедините зарегистрированных участников в команду
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", fontWeight: 500 }}>
                      Название команды *
                    </label>
                    <Input
                      required
                      placeholder="Например: Сборная ДГТУ-1"
                      value={teamName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", fontWeight: 500 }}>
                      Выберите участников команды ({selectedAthletes.length} выбрано):
                    </label>
                    <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "6px", padding: "0.5rem" }}>
                      {registrations.map((reg) => (
                        <label
                          key={reg.athlete_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.4rem",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAthletes.includes(reg.athlete_id)}
                            onChange={() => handleToggleAthleteForTeam(reg.athlete_id)}
                          />
                          <span>
                            {reg.full_name} ({reg.organization || reg.city || "Спортсмен"})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createTeamMutation.isPending || !teamName.trim() || selectedAthletes.length === 0}
                  >
                    {createTeamMutation.isPending ? "Создание..." : "Сформировать команду"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Results */}
      {activeTab === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card>
            <CardHeader>
              <CardTitle>Итоговый протокол турнира</CardTitle>
              <CardDescription>
                Официальные результаты и начисленные баллы по правилам arena-2
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p style={{ opacity: 0.7 }}>Результаты турнира пока не опубликованы</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.875rem", opacity: 0.7 }}>
                        <th style={{ padding: "0.75rem 0.5rem", width: "70px" }}>Место</th>
                        <th style={{ padding: "0.75rem 0.5rem" }}>Участник</th>
                        <th style={{ padding: "0.75rem 0.5rem" }}>Результат / Задачи</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res, idx) => (
                        <tr
                          key={res.id || idx}
                          style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
                        >
                          <td style={{ padding: "0.75rem 0.5rem" }}>
                            <span
                              style={{
                                display: "inline-block",
                                width: "28px",
                                height: "28px",
                                lineHeight: "28px",
                                textAlign: "center",
                                borderRadius: "6px",
                                fontWeight: 700,
                                background: res.place <= 3 ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
                                color: res.place <= 3 ? "#60a5fa" : "inherit",
                              }}
                            >
                              {res.place}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 0.5rem" }}>
                            {res.athlete_id ? (
                              <a
                                href={`/athletes/${res.athlete_id}`}
                                style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}
                              >
                                {res.name || `Спортсмен #${res.athlete_id}`}
                              </a>
                            ) : (
                              <strong>{res.name || `Команда #${res.team_id}`}</strong>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 0.5rem", opacity: 0.85 }}>
                            {res.score_text || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizer: Edit & Publish Results */}
          {isOrganizer && (
            <Card>
              <CardHeader>
                <CardTitle>Публикация / Редактирование протокола</CardTitle>
                <CardDescription>
                  Внесите итоговые места и результаты участников для пересчёта рейтинга республики
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {resultsList.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        background: "rgba(255, 255, 255, 0.02)",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ width: "90px" }}>
                        <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Место</label>
                        <Input
                          type="number"
                          min={1}
                          value={row.place}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const val = parseInt(e.target.value) || 1;
                            const next = [...resultsList];
                            next[idx].place = val;
                            setResultsList(next);
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                          {competition.format === "team" ? "Команда" : "Спортсмен"}
                        </label>
                        {competition.format === "team" ? (
                          <select
                            style={{
                              width: "100%",
                              padding: "0.6rem",
                              borderRadius: "6px",
                              background: "#18181b",
                              color: "#fff",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                            }}
                            value={row.team_id || ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              const next = [...resultsList];
                              next[idx].team_id = val;
                              setResultsList(next);
                            }}
                          >
                            <option value="">Выберите команду...</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            style={{
                              width: "100%",
                              padding: "0.6rem",
                              borderRadius: "6px",
                              background: "#18181b",
                              color: "#fff",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                            }}
                            value={row.athlete_id || ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || undefined;
                              const next = [...resultsList];
                              next[idx].athlete_id = val;
                              setResultsList(next);
                            }}
                          >
                            <option value="">Выберите спортсмена...</option>
                            {registrations.map((r) => (
                              <option key={r.athlete_id} value={r.athlete_id}>
                                {r.full_name} ({r.city || r.organization})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: "180px" }}>
                        <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Результат / Баллы</label>
                        <Input
                          placeholder="Например: 6 задач, 420 баллов"
                          value={row.score_text}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const next = [...resultsList];
                            next[idx].score_text = e.target.value;
                            setResultsList(next);
                          }}
                        />
                      </div>

                      <div style={{ paddingTop: "1rem" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveResultRow(idx)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <Button variant="outline" size="sm" onClick={handleAddResultRow}>
                      + Добавить строку в протокол
                    </Button>
                    <Button
                      size="sm"
                      disabled={publishResultsMutation.isPending || resultsList.length === 0}
                      onClick={handleSaveResults}
                    >
                      {publishResultsMutation.isPending ? "Сохранение..." : "Сохранить и опубликовать протокол"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Organizer Management */}
      {activeTab === "admin" && isOrganizer && (
        <Card>
          <CardHeader>
            <CardTitle>Статус соревнования и регламент</CardTitle>
            <CardDescription>
              Управление жизненным циклом турнира
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <Button
                variant={competition.status === "draft" ? "default" : "outline"}
                disabled={updateCompetitionMutation.isPending}
                onClick={() =>
                  updateCompetitionMutation.mutate({
                    id: competition.id,
                    input: { ...competition, status: "draft" },
                  })
                }
              >
                Черновик
              </Button>
              <Button
                variant={competition.status === "open" ? "default" : "outline"}
                disabled={updateCompetitionMutation.isPending}
                onClick={() =>
                  updateCompetitionMutation.mutate({
                    id: competition.id,
                    input: { ...competition, status: "open" },
                  })
                }
              >
                Открыть регистрацию
              </Button>
              <Button
                variant={competition.status === "running" ? "default" : "outline"}
                disabled={updateCompetitionMutation.isPending}
                onClick={() =>
                  updateCompetitionMutation.mutate({
                    id: competition.id,
                    input: { ...competition, status: "running" },
                  })
                }
              >
                Идёт турнир
              </Button>
              <Button
                variant={competition.status === "completed" ? "default" : "outline"}
                disabled={updateCompetitionMutation.isPending}
                onClick={() =>
                  updateCompetitionMutation.mutate({
                    id: competition.id,
                    input: { ...competition, status: "completed" },
                  })
                }
              >
                Завершить турнир
              </Button>
            </div>

            <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>
              Текущий статус: <strong>{COMPETITION_STATUSES[competition.status]}</strong>. При завершении турнира
              и публикации результатов рейтинг всех спортсменов в системе пересчитывается автоматически.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
