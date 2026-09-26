"use client";

import { Button } from "@/shared/ui";
import styles from "./RegisterPrompt.module.css";

interface Props {
  canRegister?: boolean;
  onRegister?: () => void;
  isRegisterPending?: boolean;
}

export function RegisterPrompt({ canRegister, onRegister, isRegisterPending }: Props) {
  return (
    <div className={styles.box}>
      <p className={styles.text}>
        {canRegister
          ? "Для отправки решения необходимо зарегистрироваться на турнир."
          : "Отправка решений доступна только зарегистрированным участникам."}
      </p>
      {canRegister && onRegister && (
        <Button size="sm" disabled={isRegisterPending} onClick={onRegister}>
          {isRegisterPending ? "Регистрация…" : "Подать заявку на участие"}
        </Button>
      )}
    </div>
  );
}
