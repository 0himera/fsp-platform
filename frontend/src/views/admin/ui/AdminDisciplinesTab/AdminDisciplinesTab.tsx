import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/shared/ui";
import { useDisciplinesQuery } from "@/entities/discipline";
import { useCreateDisciplineMutation } from "@/features/manage-disciplines";
import styles from "./AdminDisciplinesTab.module.css";

export const AdminDisciplinesTab: React.FC = () => {
  const { data: disciplines, isLoading } = useDisciplinesQuery();
  const createMutation = useCreateDisciplineMutation();
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    createMutation.mutate({ code: code.trim(), name: name.trim() }, {
      onSuccess: () => { setCode(""); setName(""); },
    });
  };

  if (isLoading) return <p>Загрузка дисциплин...</p>;

  return (
    <Card>
      <CardHeader><CardTitle>Официальные спортивные дисциплины</CardTitle></CardHeader>
      <CardContent>
        <div className={styles.list}>
          {disciplines?.map((d) => (
            <div key={d.code} className={styles.item}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.code}>{d.code}</span>
            </div>
          ))}
        </div>
        <form className={styles.addForm} onSubmit={handleAdd}>
          <Input placeholder="Код (например, ai_prog)" required value={code} onChange={(e) => setCode(e.target.value)} />
          <Input placeholder="Название дисциплины" required value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={createMutation.isPending}>Добавить</Button>
        </form>
      </CardContent>
    </Card>
  );
};
