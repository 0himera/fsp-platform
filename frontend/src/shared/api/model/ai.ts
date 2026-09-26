export interface AiMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface AiChatSource {
  title: string;
  content: string;
}

export interface AiChatResponse {
  answer: string;
  sources?: AiChatSource[];
}
