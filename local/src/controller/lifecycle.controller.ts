import Bonjour from "bonjour-service";
import { Express } from "express";
import { Server } from "http";
import { machineId as getMachineId } from "node-machine-id";
import { ERR_CODE } from "../constants";
import { MqAccountModel } from "../models";
import deviceController from "./device.controller";
import messageController from "./message.controller";

class LifecycleController {
  private bonjour?: Bonjour;
  private server?: Server;
  private machineId?: string;

  private static instance: LifecycleController;

  private constructor(private readonly app: Express) {}

  static init(app: Express) {
    if (!LifecycleController.instance) {
      LifecycleController.instance = new LifecycleController(app);
    }
    return LifecycleController.instance;
  }

  static getInstance() {
    if (!LifecycleController.instance) {
      throw new Error(
        "LifecycleController must be initialized with init(app) first.",
      );
    }
    return LifecycleController.instance;
  }

  async initDevice() {
    try {
      if (!this.machineId) {
        this.machineId = await getMachineId();
      }

      const account = await deviceController.checkAccount(this.machineId);

      if (account) {
        this.startMqtt(account);
      } else {
        this.startMdns();
      }
    } catch (error) {
      deviceController.sendErr(ERR_CODE.INIT_DEVICE, `${error}`);
      console.error("[Lifecycle] Failed to initialize device:", error);
      throw error;
    }
  }

  async dispose() {
    await this.stopMdns();
    await this.stopMqtt();
  }

  public startMqtt(account: MqAccountModel): void {
    console.info("[lifecycle] mqtt start subscription");
    messageController.subscribe({ machineId: this.machineId!, ...account });
  }

  public startMdns() {
    if (this.server) return;

    const PORT = process.env.MDNS_PORT
      ? parseInt(process.env.MDNS_PORT)
      : 50000;
    this.bonjour = new Bonjour();

    this.server = this.app.listen(PORT, () => {
      console.log(`listening on port ${PORT}`);

      this.bonjour!.publish({
        name: "device",
        type: "http",
        port: PORT,
        host: "device.local",
        disableIPv6: true,
      });

      console.log("[lifecycle] mdns started");
    });
  }

  public stopMdns(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.bonjour?.unpublishAll();
      this.bonjour?.destroy();

      this.server.close(() => {
        console.log("[lifecycle] mdns server closed successfully");
        this.server = undefined;
        this.bonjour = undefined;
        resolve();
      });
    });
  }

  public async stopMqtt() {
    console.log("[lifecycle] mqtt stop subscription");
    await messageController.dispose();
  }
}

export default LifecycleController;
