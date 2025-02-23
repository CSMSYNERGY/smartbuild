import express from "express";
import authRoutes from "./authRoutes.js";
import actionsRoutes from "./actionsRoutes.js";
import { verifyWebhook } from "../middlewares/authMiddleWare.js";
import { getOpportunityTest } from "../controllers/actionsController.js";


const router = express.Router();
router.get("/", (_, res) => res.send("GHLSmartBuildApp is running..."));
router.get("/test", getOpportunityTest);

router.use("/auth", authRoutes);
router.use("/actions", verifyWebhook, actionsRoutes);


export default router;
