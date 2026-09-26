import * as React from "react";
import type { ChatMessage } from "../../model/types";
import { MarkdownText } from "../MarkdownText";
import styles from "./AiAssistantMessageList.module.css";

interface Props {
  messages: ChatMessage[];
  isPending: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
}

export const AiAssistantMessageList: React.FC<Props> = ({ messages, isPending, endRef }) => (
  <div className={styles.messages}>
    {messages.map((m, i) => (
      <div
        key={i}
        className={`${styles.message} ${m.role === "user" ? styles.userMessage : styles.aiMessage}`}
      >
        <MarkdownText text={m.content} />
        {m.sources && m.sources.length > 0 && (
          <div className={styles.sources}>
            <span>Источники:</span>
            <div className={styles.sourcesList}>
              {m.sources.map((s, idx) => (
                <span key={idx} className={styles.sourceTag} title={s.content}>
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
    {isPending && (
      <div className={`${styles.message} ${styles.aiMessage}`}>
        <span>ИИ думает...</span>
      </div>
    )}
    <div ref={endRef} />
  </div>
);
