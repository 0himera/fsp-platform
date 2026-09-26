import { Input } from "@/shared/ui";
import type { CompetitionSchedule, CompetitionScheduleField } from "../../model/schedule";
import styles from "./CompetitionScheduleFields.module.css";

interface Props {
  value: CompetitionSchedule;
  onChange: (field: CompetitionScheduleField, value: string) => void;
  disabled?: boolean;
}

export function CompetitionScheduleFields({ value, onChange, disabled = false }: Props) {
  return (
    <div className={styles.fields}>
      <label>Начало турнира<Input required type="datetime-local" step="60" value={value.startsAt} onChange={(event) => onChange("startsAt", event.target.value)} disabled={disabled} /></label>
      <label>Закрытие заявок<Input required type="datetime-local" step="60" max={value.endsAt} value={value.registrationDeadline} onChange={(event) => onChange("registrationDeadline", event.target.value)} disabled={disabled} /></label>
      <label>Окончание турнира<Input required type="datetime-local" step="60" min={value.startsAt} value={value.endsAt} onChange={(event) => onChange("endsAt", event.target.value)} disabled={disabled} /></label>
      <p className={styles.hint}>Укажите дату и время в вашем часовом поясе. Дедлайн можно поставить и после начала турнира.</p>
    </div>
  );
}
