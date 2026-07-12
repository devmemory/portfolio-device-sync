import axios, { AxiosInstance } from "axios";
import { DeviceInfoModel } from "src/models";

export class LocalApi {
  private instance!: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_LOCAL_BASE_URL,
      timeout: 60000,
    });
  }

  // true: Ok
  async checkDevice(): Promise<boolean> {
    const res = await this.instance.get("/api/local/device/status");

    return res.data;
  }

  // true: Ok
  async startPair(model: DeviceInfoModel): Promise<boolean> {
    const { data } = await this.instance.post<boolean>("/api/local/device/pair", model);

    return data;
  }
}
