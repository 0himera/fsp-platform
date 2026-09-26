import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/shared/ui";
import { useCompetitionJudgesQuery, useAddCompetitionJudgeMutation, useCoachesQuery } from "@/entities/staff";
import styles from "./CompetitionJudges.module.css";

interface Props {
  competitionId: number;
}

export const CompetitionJudges: React.FC<Props> = ({ competitionId }) => {
  const { data: judges = [] } = useCompetitionJudgesQuery(competitionId);
  const { data: staff = [] } = useCoachesQuery();
  const addJudge = useAddCompetitionJudgeMutation();
  const [selectedStaffId, setSelectedStaffId] = React.useState<number>(0);
  const [roleNote, setRoleNote] = React.useState("Судья");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    addJudge.mutate({ competitionId, judgeId: selectedStaffId, roleNote: roleNote.trim() });
  };

  return (
    <Card className={styles.card}>
      <CardHeader><CardTitle>Судейская коллегия ({judges.length})</CardTitle></CardHeader>
      <CardContent>
        {judges.length === 0 ? <p className={styles.empty}>Судьи пока не назначены</p> : (
          <ul className={styles.list}>
            {judges.map((j) => (
              <li key={j.user_id} className={styles.item}>
                <strong>{j.full_name}</strong>
                <span>{j.role_note}</span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAdd} className={styles.form}>
          <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(Number(e.target.value))} className={styles.select}>
            <option value={0}>Выберите судью из базы кадров...</option>
            {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.role})</option>)}
          </select>
          <Input placeholder="Роль / должность" value={roleNote} onChange={(e) => setRoleNote(e.target.value)} />
          <Button size="sm" type="submit" disabled={!selectedStaffId || addJudge.isPending}>
            {addJudge.isPending ? "Назначение..." : "Назначить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
