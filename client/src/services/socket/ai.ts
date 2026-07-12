import { WsService } from "./ws";

export class AIService extends WsService {
  constructor(private deviceId: number) {
    super({ deviceId, url: `${import.meta.env.VITE_WS_BASE_URL}/conversation` });
  }

  
}
