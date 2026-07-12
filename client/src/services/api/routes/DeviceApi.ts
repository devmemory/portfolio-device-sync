import {
  DeviceErrorModel,
  DeviceModel,
  MsgModel,
  PageModel,
  PageWithDeviceId,
} from "src/models";
import Api from "../api";

export class DeviceApi extends Api {
  async getPairToken() {
    const { data } = await super.post<string>("/api/device/pair-token", null);

    return data;
  }

  async getList(model: PageModel) {
    const { data } = await super.get<{ list: DeviceModel[]; total: number }>(
      "/api/device/list",
      model,
    );

    return data;
  }

  async getErrors(model: PageWithDeviceId) {
    const { data } = await super.get<{
      list: DeviceErrorModel[];
      total: number;
    }>("/api/device/errors", { ...model, orderBy: "createdAt", order: "desc" });

    return data;
  }

  async removeDevice(deviceId: number) {
    const { data } = await super.delete<boolean>("/api/device/remove", {
      deviceId,
    });

    return data;
  }

  async sendMsg(model: MsgModel) {
    const { data } = await super.post<boolean>("/api/device/send", model);

    return data;
  }
}
