import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyAPIKey } from "../middlewares/authMiddleware.js";
import { actionLogger } from "../middlewares/loggerMiddleware.js";

const router = express.Router();
router.get("/", (_, res) => res.send("GHLSmartBuildApp is running..."));
router.use("/auth", authRoutes);
router.use("/actions", actionLogger, verifyAPIKey, actionsRoutes); // For testing. Remove actionLogger for prod..

export default router;
