import { Conversation, PageModel } from "src/models";
import Api from "../api";

export class ConverationApi extends Api {
  async getList(model: PageModel) {
    const { data } = await super.get<{ list: Conversation[]; total: number }>(
      "/api/conversation/list",
      model,
    );

    return data;
  }
}
