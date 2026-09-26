import * as React from "react";
import styles from "./TeamRegistrationForm.module.css";

interface Props {
  maxSize: number;
  isPending: boolean;
  errorMessage?: string;
  onSubmit: (name: string, description: string, emails: string[]) => void;
}

export const TeamRegistrationForm: React.FC<Props> = ({
  maxSize,
  isPending,
  errorMessage,
  onSubmit,
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [emails, setEmails] = React.useState("");
  const emailList = emails.split(/[\s,;]+/).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name.trim(), description.trim(), emailList);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>Название команды<input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Описание<textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <label>Пригласить по почте<textarea placeholder="Каждый адрес с новой строки" value={emails} onChange={(e) => setEmails(e.target.value)} /></label>
      <small>Можно указать до {maxSize - 1} адресов</small>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <button disabled={isPending || emailList.length > maxSize - 1}>
        {isPending ? "Создаём…" : "Создать команду"}
      </button>
    </form>
  );
};
