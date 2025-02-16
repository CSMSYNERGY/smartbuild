import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyApiKey } from "../middlewares/authMiddleWare.js";
const router = express.Router();
router.get("/", (_, res) => res.send("GHLSmartBuildApp is running..."));
router.use("/auth", authRoutes);
router.use("/actions", verifyApiKey, actionsRoutes);


export default router;
