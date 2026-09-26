import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/shared/ui";
import { useUpdateRankMutation } from "@/features/manage-rank";
import styles from "./AthleteRankModal.module.css";

const RANKS = [
  { code: "none", label: "Без разряда" },
  { code: "III", label: "III спортивный разряд" },
  { code: "II", label: "II спортивный разряд" },
  { code: "I", label: "I спортивный разряд" },
  { code: "KMS", label: "КМС" },
  { code: "MS", label: "МС" },
  { code: "MSMK", label: "МСМК" },
  { code: "ZMS", label: "ЗМС" },
];

interface AthleteRankModalProps {
  athleteId: number;
  initialRank: string;
  onClose: () => void;
}

export const AthleteRankModal: React.FC<AthleteRankModalProps> = ({
  athleteId,
  initialRank,
  onClose,
}) => {
  const [rank, setRank] = React.useState(initialRank);
  const updateMutation = useUpdateRankMutation();

  const handleSave = () => {
    updateMutation.mutate({ athleteId, rankCode: rank }, { onSuccess: onClose });
  };

  return (
    <div className={styles.modalBackdrop}>
      <Card className={styles.modalBox}>
        <CardHeader>
          <CardTitle>Изменение разряда</CardTitle>
          <CardDescription>Официальное присвоение разряда спортсмену</CardDescription>
        </CardHeader>
        <CardContent>
          <select value={rank} onChange={(e) => setRank(e.target.value)} className={styles.select}>
            {RANKS.map((r) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>
          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
