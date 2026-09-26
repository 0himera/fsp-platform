"use client";

import * as React from "react";
import styles from "./EditorTextarea.module.css";

interface Props {
  code: string;
  onChange: (code: string) => void;
}

export function EditorTextarea({ code, onChange }: Props) {
  const lineCount = React.useMemo(() => Math.max(1, code.split("\n").length), [code]);
  const lines = React.useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      onChange(newCode);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.lineNumbers}>
        {lines.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <textarea
        className={styles.textarea}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}
