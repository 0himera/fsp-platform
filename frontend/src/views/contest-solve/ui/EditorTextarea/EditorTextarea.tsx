"use client";

import * as React from "react";
import { tokenizePython } from "./lib/pythonTokenizer";
import styles from "./EditorTextarea.module.css";

interface Props {
  code: string;
  onChange: (code: string) => void;
}

export function EditorTextarea({ code, onChange }: Props) {
  const preRef = React.useRef<HTMLPreElement>(null);
  const linesRef = React.useRef<HTMLDivElement>(null);
  const lineCount = React.useMemo(() => Math.max(1, code.split("\n").length), [code]);
  const lines = React.useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);
  const tokens = React.useMemo(() => tokenizePython(code), [code]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (linesRef.current) linesRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const s = e.currentTarget.selectionStart;
    onChange(code.substring(0, s) + "    " + code.substring(e.currentTarget.selectionEnd));
    requestAnimationFrame(() => {
      if (e.currentTarget) e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 4;
    });
  };

  return (
    <div className={styles.container}>
      <div ref={linesRef} className={styles.lineNumbers}>
        {lines.map((n) => <div key={n}>{n}</div>)}
      </div>
      <div className={styles.editorWrap}>
        <pre ref={preRef} className={styles.highlightPre}>
          <code>{tokens.map((t, i) => <span key={i} className={styles[t.type]}>{t.text}</span>)}{code.endsWith("\n") && " "}</code>
        </pre>
        <textarea
          className={styles.textarea}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
