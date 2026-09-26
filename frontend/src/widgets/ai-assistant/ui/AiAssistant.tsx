"use client";

import * as React from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useAiChatMutation } from "@/entities/ai";
import type { AiMessage, AiChatSource } from "@/shared/api";
import { MarkdownText } from "./MarkdownText";
import styles from "./AiAssistant.module.css";

interface ChatMessage extends AiMessage {
  sources?: AiChatSource[];
}

const QUICK_QUESTIONS = [
  "Какие соревнования открыты сейчас?",
  "Как начисляются баллы в рейтинге?",
  "Как подать командную заявку?",
];

export function AiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "model",
      content: "Здравствуйте! Я ИИ-помощник Арены ФСП Дагестана. Могу ответить на вопросы по регламенту турниров, правилам рейтинга, составам и документам. Чем помочь?",
    },
  ]);

  const chatMutation = useAiChatMutation();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    // Prepare full conversation history for API (including initial greeting as model message)
    const historyPayload = nextMessages.slice(0, -1);

    chatMutation.mutate(
      { message: text, history: historyPayload },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              content: data.answer,
              sources: data.sources,
            },
          ]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              content: `Ошибка: ${err instanceof Error ? err.message : "Не удалось получить ответ"}. Пожалуйста, попробуйте снова.`,
            },
          ]);
        },
      }
    );
  };

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="ИИ-помощник"
        title="ИИ-помощник Федерации"
      >
        <Sparkles size={24} />
      </button>

      {isOpen && (
        <div className={styles.window} role="dialog" aria-label="Чат с ИИ-помощником">
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Bot size={18} color="var(--primary)" />
              <span>ИИ-помощник ФСП РД</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
          </div>

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
                    <div>
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
            {chatMutation.isPending && (
              <div className={`${styles.message} ${styles.aiMessage}`}>
                <span>ИИ думает...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className={styles.suggestions}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.suggestionBtn}
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              className={styles.input}
              placeholder="Спросите о турнирах, регламенте..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={chatMutation.isPending || !input.trim()}
              aria-label="Отправить"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
