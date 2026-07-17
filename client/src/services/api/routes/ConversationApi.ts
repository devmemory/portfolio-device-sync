import { Conversation, ConversationContent, PageModel } from "src/models";
import Api from "../api";

export class ConverationApi extends Api {
  async getList(model: PageModel) {
    const { data } = await super.get<{ list: Conversation[]; total: number }>(
      "/api/conversation/list",
      model,
    );

    return data;
  }

  async getContents(conversationId: number, model: PageModel) {
    const { data } = await super.get<{
      list: ConversationContent[];
      total: number;
    }>("/api/conversation/contents", { ...model, conversationId });

    return data;
  }

  async removeConversation(conversationId: number) {
    const { data } = await super.delete<boolean>("/api/conversation/remove", {
      conversationId,
    });

    return data;
  }
}
