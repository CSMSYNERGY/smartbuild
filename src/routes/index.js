import express from "express";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.get("/", (req, res) => res.send("GHLSmartBuildApp is running..."));

export default router;
