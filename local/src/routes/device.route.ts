import { Router } from "express";
import deviceController from "../controller/device.controller";

const router = Router();

router.get("/status", deviceController.getStatus);
router.post("/pair", deviceController.pairDevice);

export default router;
