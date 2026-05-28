import { Express } from "express";
import device from "./device.route";

export const setRoutes = (app: Express) => {
  app.use("/api/local/device", device);
};
