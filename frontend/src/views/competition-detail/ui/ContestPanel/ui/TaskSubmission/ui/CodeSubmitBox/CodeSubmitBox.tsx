"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useSubmitCodeMutation } from "@/entities/contest";
import styles from "./CodeSubmitBox.module.css";

interface Props {
  competitionId: number;
  taskId: number;
}

export function CodeSubmitBox({ competitionId, taskId }: Props) {
  const submitCode = useSubmitCodeMutation(competitionId);
  const [language, setLanguage] = React.useState("cpp");
  const [sourceCode, setSourceCode] = React.useState("");

  const handleSubmit = () => {
    if (!sourceCode.trim()) return;
    submitCode.mutate(
      { taskId, language, sourceCode },
      { onSuccess: () => setSourceCode("") }
    );
  };

  return (
    <div className={styles.box}>
      <label className={styles.label} htmlFor={`code-${taskId}`}>
        Отправить исходный код решения
      </label>
      <select
        id={`lang-${taskId}`}
        className={styles.select}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="go">Go</option>
        <option value="java">Java</option>
        <option value="javascript">JavaScript</option>
      </select>
      <textarea
        id={`code-${taskId}`}
        className={styles.textarea}
        rows={6}
        spellCheck={false}
        placeholder="Вставьте исходный код решения"
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
      />
      <Button size="sm" disabled={submitCode.isPending || !sourceCode.trim()} onClick={handleSubmit}>
        {submitCode.isPending ? "Отправка…" : "Отправить решение"}
      </Button>
    </div>
  );
}
