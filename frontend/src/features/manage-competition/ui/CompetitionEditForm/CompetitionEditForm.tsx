import * as React from "react";
import { Button, Input } from "@/shared/ui";
import type { Competition, CreateCompetitionInput } from "@/shared/api";
import { useUpdateCompetitionMutation } from "../../api/manageCompetitionApi";
import { fromDateTimeLocal, toDateTimeLocal, type CompetitionSchedule, type CompetitionScheduleField } from "../../model/schedule";
import { CompetitionScheduleFields } from "../CompetitionScheduleFields/CompetitionScheduleFields";
import styles from "./CompetitionEditForm.module.css";

interface Props {
  competition: Competition;
}

export function CompetitionEditForm({ competition }: Props) {
  const update = useUpdateCompetitionMutation();
  const [title, setTitle] = React.useState(competition.title);
  const [location, setLocation] = React.useState(competition.location);
  const [description, setDescription] = React.useState(competition.description);
  const [schedule, setSchedule] = React.useState<CompetitionSchedule>({
    startsAt: toDateTimeLocal(competition.starts_at),
    registrationDeadline: toDateTimeLocal(competition.registration_deadline),
    endsAt: toDateTimeLocal(competition.ends_at),
  });
  const setScheduleField = (field: CompetitionScheduleField, value: string) => setSchedule((current) => ({ ...current, [field]: value }));

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const input: CreateCompetitionInput = {
      title,
      level_code: competition.level_code,
      discipline_code: competition.discipline_code,
      format: competition.format,
      max_team_size: competition.max_team_size,
      starts_at: fromDateTimeLocal(schedule.startsAt),
      registration_deadline: fromDateTimeLocal(schedule.registrationDeadline),
      ends_at: fromDateTimeLocal(schedule.endsAt),
      location,
      description,
      status: competition.status,
      stage: competition.stage,
      qualifying_competition_id: competition.qualifying_competition_id,
      qualifying_place_limit: competition.qualifying_place_limit,
    };
    update.mutate({ id: competition.id, input });
  };

  return (
    <form className={styles.form} onSubmit={save}>
      <label>Название<Input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Место проведения<Input maxLength={160} value={location} onChange={(event) => setLocation(event.target.value)} /></label>
      <label>Описание<textarea maxLength={3000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <CompetitionScheduleFields value={schedule} onChange={setScheduleField} disabled={competition.status === "completed"} />
      {competition.status === "completed" && <p className={styles.note}>У завершённого турнира даты и дедлайны уже нельзя менять.</p>}
      {update.error && <p className={styles.error}>{update.error.message}</p>}
      {update.isSuccess && <p className={styles.success}>Изменения сохранены.</p>}
      <Button type="submit" disabled={update.isPending}>{update.isPending ? "Сохраняем…" : "Сохранить изменения"}</Button>
    </form>
  );
}
