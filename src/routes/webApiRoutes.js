//webApiRoutes.js
import express from "express";
import { getWebUser } from "../controllers/webApiController.js";
const router = express.Router();

router.get("/me", getWebUser);
export default router;