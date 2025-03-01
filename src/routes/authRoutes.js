import express from "express";

import { authenticateSmartbuildPost, authorize, callback, success } from "../controllers/authController.js";
const router = express.Router();

router.get("/authorize", authorize);
router.get("/callback", callback);
router.get("/success", success);
router.post("/authenticate-smartbuild", authenticateSmartbuildPost);
export default router;
