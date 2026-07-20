import { io, Socket } from "socket.io-client";
import { MSG, WebRTC_CMD } from "src/constants";
import { authUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";
import { refreshToken } from "../api/ApiErrorHandler";

interface Props {
  deviceId: number;
  url: string;
  joinData?: Record<string, unknown>;
}

export class WsService {
  private socket!: Socket;
  private joinData?: Record<string, unknown>;

  constructor({ deviceId, url, joinData }: Props) {
    this.joinData = joinData;
    const token = authUtil.getToken.accessToken;

    this.socket = io(url, {
      transportOptions: {
        polling: { extraHeaders: { Authorization: `Bearer ${token}` } },
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
    });

    this.socket.on("connect", () => {
      console.log("[ws] connected");

      this.emit(MSG.JOIN, { deviceId, ...this.joinData });
    });

    this.socket.on("error", async (error) => {
      console.error("[ws] error", { error });

      const { message } = error.message;

      if (message.includes("Expired") || message.includes("Unauthorized")) {
        const res = await refreshToken();

        if (res) {
          window.location.reload();
        }
      }

      popupEventBus.emit(`${message}`);
    });
  }

  protected disposeSocket() {
    this.socket.off("connect");
    this.socket.off("error");
    this._offListeners();
    this.socket.disconnect();
  }

  protected emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  protected emitWithAck<T>(event: string, data: unknown) {
    return new Promise<T>((resolve, reject) => {
      this.socket.timeout(10000).emit(
        event,
        data,
        (error: Error | null, response: T) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        },
      );
    });
  }

  protected on(event: string, callback: any) {
    this.socket.on(event, callback);
  }

  protected reconnectWithJoinData(joinData: Record<string, unknown>) {
    this.joinData = joinData;

    if (this.socket.connected) {
      this.socket.disconnect().connect();
    }
  }

  private _offListeners() {
    [
      WebRTC_CMD.ANSWER,
      WebRTC_CMD.CANDIDATE,
      MSG.SIGNAL,
      MSG.CONVERSATION,
    ].forEach((event) => {
      this.socket.off(event);
    });
  }
}
