import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/shared/ui";
import { CompetitionScheduleFields, createDefaultSchedule, fromDateTimeLocal, type CompetitionSchedule, type CompetitionScheduleField, useCreateCompetitionMutation } from "@/features/manage-competition";
import { useDisciplinesQuery } from "@/entities/discipline";
import { COMPETITION_LEVELS } from "@/shared/config";
import styles from "./AdminCreateTab.module.css";

interface AdminCreateTabProps {
  onSuccess: () => void;
}

export const AdminCreateTab: React.FC<AdminCreateTabProps> = ({ onSuccess }) => {
  const [title, setTitle] = React.useState("");
  const [format, setFormat] = React.useState<"individual" | "team">("individual");
  const [level, setLevel] = React.useState("rd_championship");
  const [customDiscipline, setCustomDiscipline] = React.useState<string | null>(null);
  const [location, setLocation] = React.useState("Махачкала, ДГТУ");
  const [description, setDescription] = React.useState("");
  const [schedule, setSchedule] = React.useState<CompetitionSchedule>(createDefaultSchedule);

  const { data: disciplines } = useDisciplinesQuery();
  const createMutation = useCreateCompetitionMutation();
  const discipline = customDiscipline ?? disciplines?.[0]?.code ?? "";
  const setScheduleField = (field: CompetitionScheduleField, value: string) => setSchedule((current) => ({ ...current, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { title, level_code: level, discipline_code: discipline, format, starts_at: fromDateTimeLocal(schedule.startsAt), ends_at: fromDateTimeLocal(schedule.endsAt), registration_deadline: fromDateTimeLocal(schedule.registrationDeadline), location, description, status: "open", stage: "standalone", max_team_size: format === "team" ? 5 : undefined },
      { onSuccess }
    );
  };

  return (
    <Card>
      <CardHeader><CardTitle>Создание нового турнира</CardTitle></CardHeader>
      <CardContent>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input placeholder="Название турнира" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Место проведения" value={location} onChange={(e) => setLocation(e.target.value)} />
          <textarea required maxLength={3000} rows={3} placeholder="Описание турнира" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className={styles.row}>
            <select value={format} onChange={(e) => setFormat(e.target.value as "individual" | "team")} className={styles.select}>
              <option value="individual">Личный зачёт</option>
              <option value="team">Командный зачёт (до 5 чел)</option>
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={styles.select}>
              {Object.entries(COMPETITION_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={discipline} onChange={(e) => setCustomDiscipline(e.target.value)} className={styles.select}>
              {disciplines?.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </div>
          <CompetitionScheduleFields value={schedule} onChange={setScheduleField} />
          {createMutation.error && <p role="alert">{createMutation.error.message}</p>}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создание..." : "Создать и открыть регистрацию"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
