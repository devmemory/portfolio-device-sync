export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationContent {
  id: number;
  content: string;
  speakerType: 0 | 1;
  createdAt: string;
}
