//deposytWebhookRoutes.js
import express from "express";
import { handleSubscriptionEventController } from "../controllers/subscriptionController.js";
const router = express.Router();
router.use(express.json());
router.post("/subscription", handleSubscriptionEventController);
export default router;