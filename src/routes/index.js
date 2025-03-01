import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyWebhook } from "../middlewares/authMiddleware.js";
import { actionLogger } from "../middlewares/loggerMiddleware.js";


const router = express.Router();
router.get("/", (_, res) => res.send("GHLSmartBuildApp is running..."));
router.use("/auth", authRoutes);
router.use("/actions", actionLogger, actionsRoutes);  // For testing. Remove for production.
//router.use("/actions", verifyWebhook, actionsRoutes); // This is the production route.


export default router;
