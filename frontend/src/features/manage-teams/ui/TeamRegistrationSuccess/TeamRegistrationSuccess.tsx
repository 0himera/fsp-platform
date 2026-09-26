import * as React from "react";
import styles from "./TeamRegistrationSuccess.module.css";

interface TeamRegistrationSuccessProps {
  inviteUrl: string;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  sentCount: number;
  failedCount: number;
  errorMessage?: string;
  onClose: () => void;
}

export const TeamRegistrationSuccess: React.FC<TeamRegistrationSuccessProps> = ({
  inviteUrl,
  isPending,
  isSuccess,
  isError,
  sentCount,
  failedCount,
  errorMessage,
  onClose,
}) => (
  <div className={styles.success}>
    <strong>Команда создана, заявка подана.</strong>
    <p>Пригласите участников по общей ссылке:</p>
    <input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
    <button onClick={() => navigator.clipboard.writeText(inviteUrl)}>Скопировать ссылку</button>
    {isPending && <small>Отправляем приглашения…</small>}
    {isSuccess && <small>Письма отправлены: {sentCount}. Ошибки: {failedCount}.</small>}
    {isError && <p role="alert">Команда создана, но приглашения не отправились: {errorMessage}</p>}
    <button onClick={onClose}>Готово</button>
  </div>
);
