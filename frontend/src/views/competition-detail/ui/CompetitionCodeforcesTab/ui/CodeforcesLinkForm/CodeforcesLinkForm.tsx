"use client";

import * as React from "react";
import styles from "./CodeforcesLinkForm.module.css";

interface Props {
  onLink: (contestId: number) => void;
  pending: boolean;
}

export function CodeforcesLinkForm({ onLink, pending }: Props) {
  const [val, setVal] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(val.trim(), 10);
    if (!isNaN(id) && id > 0) onLink(id);
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Интеграция с Codeforces</h3>
      <p className={styles.desc}>
        Введите ID раунда с платформы Codeforces для автоматического импорта задач и синхронизации лидерборда.
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Например, 566 или 1985"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" disabled={pending} className={styles.btn}>
          {pending ? "Привязка…" : "Привязать раунд"}
        </button>
      </form>
      <div className={styles.presets}>
        <span>Примеры раундов:</span>
        <button type="button" className={styles.tag} onClick={() => setVal("566")}>#566 (VK Cup)</button>
        <button type="button" className={styles.tag} onClick={() => setVal("1985")}>#1985 (Div. 4)</button>
        <button type="button" className={styles.tag} onClick={() => setVal("1800")}>#1800 (Div. 3)</button>
      </div>
    </div>
  );
}
