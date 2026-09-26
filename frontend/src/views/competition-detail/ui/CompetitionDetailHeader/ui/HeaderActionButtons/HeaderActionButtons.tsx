import * as React from "react";
import { Button } from "@/shared/ui";
import styles from "./HeaderActionButtons.module.css";

interface Props {
  isTeam: boolean;
  isRegistered?: boolean;
  canRegister: boolean;
  canUnregister: boolean;
  userTeamName?: string;
  isPending: boolean;
  onRegister: () => void;
  onUnregister: () => void;
  onOpenCreateTeam: () => void;
  onGoToTeams: () => void;
}

export const HeaderActionButtons: React.FC<Props> = ({
  isTeam,
  isRegistered,
  canRegister,
  canUnregister,
  userTeamName,
  isPending,
  onRegister,
  onUnregister,
  onOpenCreateTeam,
  onGoToTeams,
}) => {
  if (isTeam && !isRegistered && canRegister) {
    return <Button onClick={onOpenCreateTeam}>Создать команду</Button>;
  }
  if (isTeam && isRegistered) {
    return (
      <Button variant="outline" onClick={onGoToTeams} className={styles.button}>
        {userTeamName ? `Команда: ${userTeamName}` : "Состав команды"}
      </Button>
    );
  }
  if (!isTeam && isRegistered) {
    return (
      <Button variant="outline" onClick={onUnregister} disabled={isPending || !canUnregister}>
        {canUnregister ? "Отозвать заявку" : "Заявка подана · приём закрыт"}
      </Button>
    );
  }
  if (!isTeam && !isRegistered && canRegister) {
    return <Button onClick={onRegister} disabled={isPending}>Подать заявку</Button>;
  }
  return null;
};
