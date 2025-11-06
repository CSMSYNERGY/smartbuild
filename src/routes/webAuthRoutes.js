//webAuthRoutes.js
import express from "express";

import { decryptAndSetSessionCookie } from "../controllers/webAuthController.js";
const router = express.Router();

router.post("/decrypt", decryptAndSetSessionCookie);
export default router;