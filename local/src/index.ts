import { config } from "dotenv";

config();

import cors from "cors";
import express from "express";
import LifecycleController from "./controller/lifecycle.controller";
import { setRoutes } from "./routes";

init().catch(console.error);

async function init() {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: ["http://localhost:3000", process.env.CLIENT_URL!] }));
  setRoutes(app);

  const controller = LifecycleController.init(app);

  await controller.initDevice();

  process.on("SIGINT", () => {
    controller.dispose();
  });
}
