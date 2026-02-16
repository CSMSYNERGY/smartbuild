//index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyAPIKey, checkLocationSubscribed } from "../middlewares/authMiddleware.js";
import { actionLogger, actionResponseLogger } from "../middlewares/loggerMiddleware.js";
import webAuthRoutes from "./webAuthRoutes.js";
import webApiRoutes from "./webApiRoutes.js";
import { requireWebSession } from "../middlewares/webAuthMiddleware.js";
import cors from "cors";
import { verifyDeposytSigningKey } from "../middlewares/deposytWebhookMiddleware.js";
import deposytWebhookRoutes from "./deposytWebhookRoutes.js";


const router = express.Router();
router.get("/", (_, res) => res.send("CPI is running..."));
router.use("/auth", authRoutes);
router.use("/actions", actionLogger, actionResponseLogger, verifyAPIKey, checkLocationSubscribed, actionsRoutes); // For testing. Remove actionLogger for prod..
router.use("/webhooks", verifyDeposytSigningKey, deposytWebhookRoutes);

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
