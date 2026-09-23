import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/shared/ui";
import { useCreateTeamMutation } from "@/features/manage-teams";
import type { Registration } from "@/shared/api";
import styles from "./CreateTeamCard.module.css";

interface CreateTeamCardProps {
  competitionId: number;
  registrations: Registration[];
}

export const CreateTeamCard: React.FC<CreateTeamCardProps> = ({
  competitionId,
  registrations,
}) => {
  const [teamName, setTeamName] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const createTeamMutation = useCreateTeamMutation();

  const toggleAthlete = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || selectedIds.length === 0) return;
    createTeamMutation.mutate(
      { competitionId, name: teamName.trim(), memberIds: selectedIds },
      { onSuccess: () => { setTeamName(""); setSelectedIds([]); } }
    );
  };

  return (
    <Card className={styles.card}>
      <CardHeader><CardTitle>Сформировать команду</CardTitle></CardHeader>
      <CardContent>
        <form className={styles.form} onSubmit={handleCreateTeam}>
          <Input placeholder="Название команды" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          <div className={styles.athletesSelect}>
            {registrations.map((r) => (
              <Button key={r.athlete_id} type="button" size="sm" variant={selectedIds.includes(r.athlete_id) ? "default" : "outline"} onClick={() => toggleAthlete(r.athlete_id)} className={styles.athleteBtn}>
                {r.full_name}
              </Button>
            ))}
          </div>
          <Button type="submit" disabled={createTeamMutation.isPending}>Создать команду</Button>
        </form>
      </CardContent>
    </Card>
  );
};
