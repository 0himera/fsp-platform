"use client";

import type { Competition } from "@/shared/api";
import { Button } from "@/shared/ui";
import { useCloseRegistrationEarlyMutation } from "@/features/manage-competition";
import styles from "./CloseRegistrationControl.module.css";

interface Props {
  competition: Competition;
}

export function CloseRegistrationControl({ competition }: Props) {
  const closeRegistration = useCloseRegistrationEarlyMutation();
  if (!competition.registration_open) return null;

  const handleClose = () => {
    if (window.confirm("Закрыть приём заявок сейчас? Соревнование и отправка решений продолжатся по расписанию.")) {
      closeRegistration.mutate(competition.id);
    }
  };

  return (
    <div className={styles.row}>
      <p className={styles.text}>
        Приём заявок открыт. Его можно закрыть, не завершая соревнование.
      </p>
      <Button variant="outline" disabled={closeRegistration.isPending} onClick={handleClose}>
        {closeRegistration.isPending ? "Закрываем…" : "Закрыть приём заявок"}
      </Button>
    </div>
  );
}
