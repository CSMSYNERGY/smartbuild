//webApiRoutes.js
import express from "express";
import { getWebUserController, getPlansController, createSubscriptionController } from "../controllers/webApiController.js";
const router = express.Router();

router.get("/me", getWebUserController);
router.get("/subscription/plans", getPlansController);
router.post("/subscription/create", createSubscriptionController);
export default router;