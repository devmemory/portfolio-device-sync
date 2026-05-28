import axios, { AxiosInstance, HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { machineId as getMachineId } from "node-machine-id";
import { MqAccountModel, ResultModel } from "../models";
import LifecycleController from "./lifecycle.controller";

class DeviceController {
  private instance!: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.CLOUD_BASE_URL,
      timeout: 30000,
    });

    this.instance.interceptors.request.use((config) => {
      config.headers["x-app-auth"] = process.env.APP_AUTH;
      return config;
    });
  }

  checkAccount = async (machineId: string) => {
    try {
      const res = await this.instance.post<ResultModel<MqAccountModel>>(
        "/api/device/mq-account",
        { machineId },
      );

      const { data } = res.data;

      return data;
    } catch (e) {
      // device not found or internal server error
      console.log({ e });

      return null;
    }
  };

  getStatus = async (req: Request, res: Response) => {
    try {
      const machineId = await getMachineId();

      const result = await this.instance.post<ResultModel<boolean>>(
        "/api/device/status",
        { machineId },
      );

      const { data } = result.data;

      res.send(data);
    } catch (e) {
      res.status(HttpStatusCode.InternalServerError).send(e);
    }
  };

  pairDevice = async (req: Request, res: Response) => {
    const { name, description, token } = req.body;

    try {
      const machineId = await getMachineId();

      const result = await this.instance.post<ResultModel<boolean>>(
        "/api/device/pair",
        {
          name,
          description,
          token,
          machineId,
        },
      );

      const { data } = result.data;

      res.send(data);
      if (data) {
        const lifecycle = LifecycleController.getInstance();

        await lifecycle.stopMdns();
        await lifecycle.initDevice();
      }
    } catch (e) {
      res.status(HttpStatusCode.InternalServerError).send(e);
    }
  };

  sendErr = async (code: number, message: string) => {
    try {
      const machineId = await getMachineId();

      await this.instance.post<ResultModel<boolean>>("/api/device/error", {
        machineId,
        code,
        message,
      });
    } catch (e) {
      console.log({ e });
    }
  };
}

export default new DeviceController();
