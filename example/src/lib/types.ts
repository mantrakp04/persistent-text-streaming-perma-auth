export interface Message {
  id: string;
  chatId: string;
  content?: string;
  streamId?: string;
  role: "user" | "assistant";
  timestamp: Date;
}
