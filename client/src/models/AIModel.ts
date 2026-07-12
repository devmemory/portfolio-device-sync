export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  contents?: ConversationContent[];
}

export interface ConversationContent {
  id: number;
  content: string;
  speakerType: string;
}
