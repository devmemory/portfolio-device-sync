import { io, Socket } from "socket.io-client";
import { MSG, WebRTC_CMD } from "src/constants";
import { authUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";

export class WsService {
  private socket!: Socket;

  constructor(deviceId: number) {
    const token = authUtil.getToken.accessToken;

    const url = `${import.meta.env.VITE_WS_BASE_URL}/device`;

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

      this.emit(MSG.JOIN, { deviceId });
    });

    this.socket.on("error", (error) => {
      console.error("[ws] error", error);
      popupEventBus.emit(error);
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

  protected on(event: string, callback: any) {
    this.socket.on(event, callback);
  }

  private _offListeners() {
    [WebRTC_CMD.ANSWER, WebRTC_CMD.CANDIDATE, MSG.SIGNAL].forEach((event) => {
      this.socket.off(event);
    });
  }
}
