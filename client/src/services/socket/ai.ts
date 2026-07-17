import { EVENT_NAME, MSG } from "src/constants";
import { WsService } from "./ws";

export class AIService extends WsService {
  private emitter = new EventTarget();
  public isReady = false;

  constructor(
    private deviceId: number,
    private conversationId: number | null,
  ) {
    super({
      deviceId,
      url: `${import.meta.env.VITE_WS_BASE_URL}/conversation`,
      joinData: { conversationId },
    });

    this.on(MSG.READY, ({ result }: { result: boolean }) => {
      this.isReady = result;
      this.emitter.dispatchEvent(new Event(EVENT_NAME));
    });
  }

  onMessage = (callback: (result: string) => void) => {
    this.on(MSG.CONVERSATION, ({ result }: { result: string }) =>
      callback(result),
    );
  };

  sendMessage = async (prompt: string) => {
    const response = await this.emitWithAck<{
      conversationId: number;
      sent: boolean;
    }>(MSG.CONVERSATION, {
      prompt,
      deviceId: this.deviceId,
      conversationId: this.conversationId,
    });

    if (!response.sent) {
      throw new Error("Failed to send message");
    }

    this.conversationId = response.conversationId;
    this.updateJoinData({
      deviceId: this.deviceId,
      conversationId: response.conversationId,
    });

    return response;
  };

  selectConversation = (conversationId: number | null) => {
    if (this.conversationId === conversationId) return;

    this.conversationId = conversationId;
    this.reconnectWithJoinData({
      deviceId: this.deviceId,
      conversationId,
    });
  };

  get currentConversationId() {
    return this.conversationId;
  }

  onChangeConnection = (callback: () => void) => {
    this.emitter.addEventListener(EVENT_NAME, callback);

    return () => this.emitter.removeEventListener(EVENT_NAME, callback);
  };

  dispose = () => {
    this.disposeSocket();
  };
}
