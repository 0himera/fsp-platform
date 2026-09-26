import { Button } from "@/shared/ui";
import type { Competition } from "@/shared/api";
import { useCloseCompetitionEarlyMutation } from "@/features/manage-competition";

interface Props {
  competition: Competition;
}

export function CloseEarlyButton({ competition }: Props) {
  const close = useCloseCompetitionEarlyMutation();
  if (competition.phase !== "current" || (competition.status !== "open" && competition.status !== "running")) return null;

  return (
    <div>
      <Button variant="outline" disabled={close.isPending} onClick={() => {
        if (window.confirm("Закрыть соревнование сейчас? Новые заявки и отправки будут остановлены.")) close.mutate(competition.id);
      }}>
        {close.isPending ? "Закрываем…" : "Завершить досрочно"}
      </Button>
      {close.error && <p className={"text-sm text-destructive"} role="alert">{close.error.message}</p>}
    </div>
  );
}
