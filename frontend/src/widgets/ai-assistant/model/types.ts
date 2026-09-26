import type { AiMessage, AiChatSource } from "@/shared/api";

export interface ChatMessage extends AiMessage {
  sources?: AiChatSource[];
}

export const QUICK_QUESTIONS = [
  "Какие соревнования открыты сейчас?",
  "Как начисляются баллы в рейтинге?",
  "Как подать командную заявку?",
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "model",
    content: "Здравствуйте! Я ИИ-помощник Арены ФСП Дагестана. Могу ответить на вопросы по регламенту турниров, правилам рейтинга, составам и документам. Чем помочь?",
  },
];
