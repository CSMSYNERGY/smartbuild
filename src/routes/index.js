//index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyAPIKey } from "../middlewares/authMiddleware.js";
import { actionLogger } from "../middlewares/loggerMiddleware.js";
import webAuthRoutes from "./webAuthRoutes.js";
import webApiRoutes from "./webApiRoutes.js";
import { requireWebSession } from "../middlewares/webAuthMiddleware.js";

const router = express.Router();
router.get("/", (_, res) => res.send("GHLSmartBuildApp is running..."));
router.use("/auth", authRoutes);
router.use("/actions", actionLogger, verifyAPIKey, actionsRoutes); // For testing. Remove actionLogger for prod..

// --- CORS for UI endpoints only (for dev + any external UI origin) ---
const webCors = cors({
  origin: [
    "http://localhost:5173", // Vite dev
  ],
  credentials: true,
});
//new web routes
router.use("/api/sso", webCors, webAuthRoutes);
router.use("/api", webCors, requireWebSession, webApiRoutes);
export default router;
