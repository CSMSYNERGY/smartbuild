//webApiRoutes.js
import express from "express";
import { getWebUserController, getPlansController, createSubscriptionController, cancelSubscriptionController, resumeSubscriptionController, updatePaymentController } from "../controllers/webApiController.js";
const router = express.Router();

router.get("/me", getWebUserController);
router.get("/subscription/plans", getPlansController);
router.post("/subscription/create", createSubscriptionController);
router.post("/subscription/cancel", cancelSubscriptionController);
router.post("/subscription/resume", resumeSubscriptionController);
router.post("/subscription/update-payment", updatePaymentController);
export default router;