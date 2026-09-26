import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/shared/ui";
import { useCreateCompetitionMutation } from "@/features/manage-competition";
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

  const { data: disciplines } = useDisciplinesQuery();
  const createMutation = useCreateCompetitionMutation();
  const discipline = customDiscipline ?? disciplines?.[0]?.code ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    createMutation.mutate(
      { title, level_code: level, discipline_code: discipline, format, starts_at: new Date(now + 7 * 86400000).toISOString(), ends_at: new Date(now + 8 * 86400000).toISOString(), registration_deadline: new Date(now + 6 * 86400000).toISOString(), location, description: title, status: "open", stage: "standalone", max_team_size: format === "team" ? 5 : undefined },
      { onSuccess }
    );
  };

  return (
    <Card>
      <CardHeader><CardTitle>Создание нового турнира</CardTitle></CardHeader>
      <CardContent>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input placeholder="Название турнира" required value={title} onChange={(e) => setTitle(e.target.value)} />
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
          <Input placeholder="Место проведения" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создание..." : "Создать и открыть регистрацию"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
