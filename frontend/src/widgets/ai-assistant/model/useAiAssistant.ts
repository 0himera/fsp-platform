import * as React from "react";
import { useAiChatMutation } from "@/entities/ai";
import { type ChatMessage, INITIAL_MESSAGES } from "./types";

export function useAiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const chatMutation = useAiChatMutation();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    chatMutation.mutate(
      { message: text, history: nextMessages.slice(0, -1) },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: "model", content: data.answer, sources: data.sources }]);
        },
        onError: (err) => {
          const content = `Ошибка: ${err instanceof Error ? err.message : "Не удалось получить ответ"}. Попробуйте снова.`;
          setMessages((prev) => [...prev, { role: "model", content }]);
        },
      }
    );
  };

  return { isOpen, setIsOpen, input, setInput, messages, chatMutation, messagesEndRef, handleSend };
}
