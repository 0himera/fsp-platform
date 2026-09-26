"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useAiAssistant } from "../../model/useAiAssistant";
import { AiAssistantHeader } from "../AiAssistantHeader";
import { AiAssistantMessageList } from "../AiAssistantMessageList";
import { AiAssistantSuggestions } from "../AiAssistantSuggestions";
import { AiAssistantInput } from "../AiAssistantInput";
import styles from "./AiAssistant.module.css";

export function AiAssistant() {
  const {
    isOpen,
    setIsOpen,
    input,
    setInput,
    messages,
    chatMutation,
    messagesEndRef,
    handleSend,
  } = useAiAssistant();

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
          <AiAssistantHeader onClose={() => setIsOpen(false)} />
          <AiAssistantMessageList
            messages={messages}
            isPending={chatMutation.isPending}
            endRef={messagesEndRef}
          />
          {messages.length <= 2 && (
            <AiAssistantSuggestions onSelect={(q) => handleSend(q)} />
          )}
          <AiAssistantInput
            input={input}
            isPending={chatMutation.isPending}
            onInputChange={setInput}
            onSubmit={() => handleSend()}
          />
        </div>
      )}
    </>
  );
}
