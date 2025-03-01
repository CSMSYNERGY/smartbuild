import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyWebhook } from "../middlewares/authMiddleware.js";


const router = express.Router();
router.get("/", (_, res) => res.send("GHLSmartBuildApp is running..."));
router.use("/auth", authRoutes);
router.use("/actions", verifyWebhook, actionsRoutes);


export default router;
