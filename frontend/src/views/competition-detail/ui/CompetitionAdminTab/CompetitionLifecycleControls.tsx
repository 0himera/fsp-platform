"use client";

import type { Competition } from "@/shared/api";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useContestQuery } from "@/entities/contest";
import {
  useCloseRegistrationEarlyMutation,
  useStartCompetitionEarlyMutation,
} from "@/features/manage-competition";

interface Props {
  competition: Competition;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось выполнить действие";
}

export function CompetitionLifecycleControls({ competition }: Props) {
  const contest = useContestQuery(competition.id);
  const closeRegistration = useCloseRegistrationEarlyMutation();
  const startEarly = useStartCompetitionEarlyMutation();
  const now = Date.now();
  const canStartEarly = competition.status === "open" &&
    new Date(competition.starts_at).getTime() > now &&
    new Date(competition.ends_at).getTime() > now;
  const hasTask = Boolean(contest.data?.tasks.length);

  if (competition.format !== "individual") return null;

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Управление этапами</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-muted-foreground">
            {competition.registration_open
              ? "Приём заявок открыт. Его можно закрыть, не завершая соревнование."
              : "Приём заявок закрыт. Зарегистрированные спортсмены сохраняют доступ к контесту."}
          </p>
          {competition.registration_open && (
            <Button
              variant="outline"
              disabled={closeRegistration.isPending}
              onClick={() => {
                if (window.confirm("Закрыть приём заявок сейчас? Соревнование и отправка решений продолжатся по расписанию.")) {
                  closeRegistration.mutate(competition.id);
                }
              }}
            >
              {closeRegistration.isPending ? "Закрываем…" : "Закрыть приём заявок"}
            </Button>
          )}
        </div>

        {canStartEarly && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-sm text-muted-foreground">
              {hasTask
                ? "Можно открыть задания и отправку решений раньше расписания. Приём заявок закроется автоматически."
                : "Чтобы начать контест раньше, сначала создайте его и добавьте хотя бы одно задание."}
            </p>
            <Button
              variant="secondary"
              disabled={!hasTask || contest.isLoading || startEarly.isPending}
              onClick={() => {
                if (window.confirm("Начать контест сейчас? Приём заявок закроется, задания и отправка решений откроются, время окончания останется прежним.")) {
                  startEarly.mutate(competition.id);
                }
              }}
            >
              {startEarly.isPending ? "Запускаем…" : "Начать контест сейчас"}
            </Button>
          </div>
        )}

        {(closeRegistration.error || startEarly.error) && (
          <p className="m-0 text-sm text-destructive" role="alert">
            {errorText(closeRegistration.error || startEarly.error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
