import * as React from "react";
import { useUpdateTeamMutation } from "../../api/manageTeamsInviteApi";
import styles from "./TeamSettings.module.css";

interface TeamSettingsProps {
  competitionId: number;
  teamId: number;
  initialName: string;
  initialDescription?: string;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  competitionId,
  teamId,
  initialName,
  initialDescription = "",
}) => {
  const [name, setName] = React.useState(initialName);
  const [description, setDescription] = React.useState(initialDescription);
  const update = useUpdateTeamMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ competitionId, teamId, name, description });
  };

  return (
    <details>
      <summary>Настройки команды</summary>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
        <button disabled={update.isPending}>Сохранить</button>
      </form>
    </details>
  );
};
