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
import { useMeQuery } from "@/entities/user";
import {
  useCompetitionsQuery,
  useCreateCompetitionMutation,
} from "@/entities/competition";
import {
  useDisciplinesQuery,
  useCreateDisciplineMutation,
  useRenameDisciplineMutation,
} from "@/entities/discipline";
import {
  COMPETITION_LEVELS,
  COMPETITION_STATUSES,
  COMPETITION_STAGES,
} from "@/shared/config";
import type { CompetitionFormat, CompetitionStatus, CompetitionStage } from "@/shared/api";

export default function AdminPage() {
  const router = useRouter();
  const { data: me, isLoading: userLoading } = useMeQuery();
  const { data: competitions, isLoading: compsLoading } = useCompetitionsQuery();
  const { data: disciplines } = useDisciplinesQuery();

  const createCompetitionMutation = useCreateCompetitionMutation();
  const createDisciplineMutation = useCreateDisciplineMutation();
  const renameDisciplineMutation = useRenameDisciplineMutation();

  const [tab, setTab] = React.useState<"competitions" | "create" | "disciplines">("competitions");

  // Create Competition Form state
  const [title, setTitle] = React.useState("");
  const [levelCode, setLevelCode] = React.useState("rd_championship");
  const [disciplineCode, setDisciplineCode] = React.useState("");
  const [format, setFormat] = React.useState<CompetitionFormat>("individual");
  const [stage, setStage] = React.useState<CompetitionStage>("standalone");
  const [qualifyingId, setQualifyingId] = React.useState<number | undefined>(undefined);
  const [qualifyingLimit, setQualifyingLimit] = React.useState<number | undefined>(undefined);
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [regDeadline, setRegDeadline] = React.useState("");
  const [location, setLocation] = React.useState("Махачкала, ДГТУ");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<CompetitionStatus>("draft");

  // Disciplines state
  const [newDiscCode, setNewDiscCode] = React.useState("");
  const [newDiscName, setNewDiscName] = React.useState("");
  const [editingDiscCode, setEditingDiscCode] = React.useState<string | null>(null);
  const [editDiscName, setEditDiscName] = React.useState("");

  React.useEffect(() => {
    if (disciplines && disciplines.length > 0 && !disciplineCode) {
      setDisciplineCode(disciplines[0].code);
    }
  }, [disciplines, disciplineCode]);

  // Set default dates (tomorrow, next week)
  React.useEffect(() => {
    const now = new Date();
    const dStarts = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const dEnds = new Date(now.getTime() + 8 * 24 * 3600 * 1000);
    const dReg = new Date(now.getTime() + 6 * 24 * 3600 * 1000);

    const toInputFormat = (d: Date) => d.toISOString().slice(0, 16);
    if (!startsAt) setStartsAt(toInputFormat(dStarts));
    if (!endsAt) setEndsAt(toInputFormat(dEnds));
    if (!regDeadline) setRegDeadline(toInputFormat(dReg));
  }, [startsAt, endsAt, regDeadline]);

  if (userLoading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "3rem auto", padding: "0 1.5rem" }}>
        <p>Проверка прав доступа...</p>
      </div>
    );
  }

  const user = me?.user;
  if (!user || user.role !== "organizer") {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <Card>
          <CardHeader>
            <CardTitle>Доступ ограничен</CardTitle>
            <CardDescription>
              Панель организатора доступна только пользователям с ролью &quot;organizer&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/#")}>На главную страницу</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt || !regDeadline) return;

    createCompetitionMutation.mutate(
      {
        title: title.trim(),
        level_code: levelCode,
        discipline_code: disciplineCode,
        format,
        stage,
        qualifying_competition_id: stage === "final" ? qualifyingId : null,
        qualifying_place_limit: stage === "final" ? qualifyingLimit : null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        registration_deadline: new Date(regDeadline).toISOString(),
        location: location.trim(),
        description: description.trim(),
        status,
      },
      {
        onSuccess: (data) => {
          setTitle("");
          setDescription("");
          setTab("competitions");
          router.push(`/competitions/${data.id}`);
        },
      }
    );
  };

  const handleCreateDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscCode.trim() || !newDiscName.trim()) return;
    createDisciplineMutation.mutate(
      { code: newDiscCode.trim().toLowerCase(), name: newDiscName.trim() },
      {
        onSuccess: () => {
          setNewDiscCode("");
          setNewDiscName("");
        },
      }
    );
  };

  const handleRenameDiscipline = (code: string) => {
    if (!editDiscName.trim()) return;
    renameDisciplineMutation.mutate(
      { code, name: editDiscName.trim() },
      {
        onSuccess: () => {
          setEditingDiscCode(null);
          setEditDiscName("");
        },
      }
    );
  };

  return (
    <main style={{ maxWidth: "1100px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Панель организатора соревнований
        </h1>
        <p style={{ opacity: 0.8 }}>
          Управление календарём турниров, формирование протоколов и справочник спортивных дисциплин
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: "1.5rem" }}>
        <Button
          variant={tab === "competitions" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("competitions")}
        >
          Все соревнования ({competitions?.length || 0})
        </Button>
        <Button
          variant={tab === "create" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("create")}
        >
          + Создать соревнование
        </Button>
        <Button
          variant={tab === "disciplines" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("disciplines")}
        >
          Справочник дисциплин ({disciplines?.length || 0})
        </Button>
      </div>

      {/* Tab: Competitions List */}
      {tab === "competitions" && (
        <Card>
          <CardHeader>
            <CardTitle>Календарь всех соревнований (включая черновики)</CardTitle>
            <CardDescription>
              Нажмите на соревнование для управления составами команд и протоколами результатов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {compsLoading ? (
              <p>Загрузка списка соревнований...</p>
            ) : !competitions || competitions.length === 0 ? (
              <p style={{ opacity: 0.7 }}>Соревнований пока нет</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {competitions.map((c) => (
                  <div
                    key={c.id}
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
                        <Badge variant={c.status === "open" ? "default" : "secondary"}>
                          {COMPETITION_STATUSES[c.status] || c.status}
                        </Badge>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                          {COMPETITION_LEVELS[c.level_code] || c.level_code}
                        </span>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                          · {c.format === "team" ? "Командный" : "Одиночный"}
                        </span>
                      </div>
                      <a
                        href={`/competitions/${c.id}`}
                        style={{ fontSize: "1.1rem", fontWeight: 600, color: "#3b82f6", textDecoration: "none" }}
                      >
                        {c.title}
                      </a>
                      <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
                        {new Date(c.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · {c.location || "Онлайн"} · Заявок: {c.registrations_count}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <a href={`/competitions/${c.id}`}>
                        <Button size="sm">Управление и протокол →</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Create Competition */}
      {tab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Создание нового соревнования</CardTitle>
            <CardDescription>
              Заполните регламент и параметры старта для публикации в едином календаре
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompetition} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                  Название соревнования *
                </label>
                <Input
                  required
                  placeholder="Например: Чемпионат Республики Дагестан по спортивному программированию 2026"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Уровень соревнования *
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
                    value={levelCode}
                    onChange={(e) => setLevelCode(e.target.value)}
                  >
                    {Object.entries(COMPETITION_LEVELS).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Дисциплина *
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
                    value={disciplineCode}
                    onChange={(e) => setDisciplineCode(e.target.value)}
                  >
                    {disciplines?.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Формат зачёта *
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
                    value={format}
                    onChange={(e) => setFormat(e.target.value as CompetitionFormat)}
                  >
                    <option value="individual">Одиночный (Индивидуальный)</option>
                    <option value="team">Командный</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Этап турнира *
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
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CompetitionStage)}
                  >
                    <option value="standalone">Отдельный зачёт</option>
                    <option value="qualification">Отборочный этап</option>
                    <option value="final">Финал (с квалификацией)</option>
                  </select>
                </div>
              </div>

              {stage === "final" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "6px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                      ID отборочного соревнования *
                    </label>
                    <Input
                      type="number"
                      required
                      placeholder="ID отбора"
                      value={qualifyingId || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQualifyingId(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                      Проходное место (лимит участников) *
                    </label>
                    <Input
                      type="number"
                      required
                      min={1}
                      placeholder="Например: 16"
                      value={qualifyingLimit || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQualifyingLimit(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Дата и время начала *
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartsAt(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Дата и время окончания *
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndsAt(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Дедлайн подачи заявок *
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={regDeadline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Место проведения (город / площадка / онлайн)
                  </label>
                  <Input
                    placeholder="г. Махачкала, проспект Имама Шамиля 70"
                    value={location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                    Начальный статус *
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
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CompetitionStatus)}
                  >
                    <option value="draft">Черновик (скрыто)</option>
                    <option value="open">Регистрация открыта</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.3rem", fontWeight: 500 }}>
                  Описание и регламент турнира
                </label>
                <textarea
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    background: "#18181b",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                  }}
                  placeholder="Укажите правила, тайминг, платформу контеста, ограничения по составу..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {createCompetitionMutation.isError && (
                <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                  {createCompetitionMutation.error instanceof Error
                    ? createCompetitionMutation.error.message
                    : "Ошибка при создании турнира"}
                </div>
              )}

              <Button
                type="submit"
                disabled={createCompetitionMutation.isPending}
                style={{ alignSelf: "flex-start" }}
              >
                {createCompetitionMutation.isPending ? "Создание..." : "Создать и сохранить соревнование"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Disciplines Dictionary */}
      {tab === "disciplines" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card>
            <CardHeader>
              <CardTitle>Спортивные дисциплины ФСП</CardTitle>
              <CardDescription>
                Официальные аккредитованные дисциплины спортивного программирования
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {disciplines?.map((d) => (
                  <div
                    key={d.code}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "6px",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    {editingDiscCode === d.code ? (
                      <div style={{ display: "flex", gap: "0.5rem", flex: 1, alignItems: "center" }}>
                        <Input
                          value={editDiscName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDiscName(e.target.value)}
                          placeholder="Новое название дисциплины"
                        />
                        <Button size="sm" onClick={() => handleRenameDiscipline(d.code)}>
                          Сохранить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDiscCode(null);
                            setEditDiscName("");
                          }}
                        >
                          Отмена
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span style={{ fontWeight: 600 }}>{d.name}</span>
                          <span style={{ fontSize: "0.8rem", opacity: 0.6, marginLeft: "0.75rem" }}>
                            ({d.code})
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDiscCode(d.code);
                            setEditDiscName(d.name);
                          }}
                        >
                          Переименовать
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Discipline Form */}
          <Card>
            <CardHeader>
              <CardTitle>Добавить новую дисциплину</CardTitle>
              <CardDescription>
                Код должен состоять из латинских букв и подчёркиваний (например: <code>robotics_uav</code>)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDiscipline} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ minWidth: "180px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: 500 }}>
                    Код дисциплины *
                  </label>
                  <Input
                    required
                    placeholder="code_example"
                    value={newDiscCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDiscCode(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1, minWidth: "260px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: 500 }}>
                    Наименование дисциплины *
                  </label>
                  <Input
                    required
                    placeholder="Например: Программирование квантовых алгоритмов"
                    value={newDiscName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDiscName(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={createDisciplineMutation.isPending}>
                  {createDisciplineMutation.isPending ? "Добавление..." : "Добавить дисциплину"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
