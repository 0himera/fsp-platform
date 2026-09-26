import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useUpdateProfileMutation } from "@/features/update-profile";
import { useDisciplinesQuery } from "@/entities/discipline";
import type { User, Athlete } from "@/shared/api";
import styles from "./ProfileEditForm.module.css";

interface ProfileEditFormProps {
  user: User;
  athlete?: Athlete;
  onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user, athlete, onCancel }) => {
  const [fullName, setFullName] = React.useState(user.full_name || "");
  const [city, setCity] = React.useState(user.city || "");
  const [org, setOrg] = React.useState(user.organization || "");
  const [cfHandle, setCfHandle] = React.useState(athlete?.codeforces_handle || "");
  const [selectedDisc, setSelectedDisc] = React.useState<string[]>(athlete?.disciplines || []);

  const updateMutation = useUpdateProfileMutation();
  const { data: disciplines } = useDisciplinesQuery();

  const toggleDisc = (name: string) => {
    setSelectedDisc((prev) => prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { full_name: fullName.trim(), city: city.trim(), organization: org.trim(), disciplines: selectedDisc, codeforces_handle: cfHandle.trim() },
      { onSuccess: onCancel }
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input placeholder="ФИО" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
      <Input placeholder="Организация / Вуз" value={org} onChange={(e) => setOrg(e.target.value)} />
      <Input placeholder="Codeforces Handle (например: tourist)" value={cfHandle} onChange={(e) => setCfHandle(e.target.value)} />
      <div className={styles.field}>
        <span className={styles.label}>Выберите дисциплины:</span>
        <div className={styles.disciplineGrid}>
          {disciplines?.map((d) => (
            <Button key={d.code} type="button" size="sm" variant={selectedDisc.includes(d.name) ? "default" : "outline"} onClick={() => toggleDisc(d.name)} className={styles.discBtn}>
              {d.name}
            </Button>
          ))}
        </div>
      </div>
      <div className={styles.buttons}>
        <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Сохранение..." : "Сохранить"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
};
