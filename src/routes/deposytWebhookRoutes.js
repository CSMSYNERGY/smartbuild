//deposytWebhookRoutes.js
import express from "express";
import { handleSubscriptionEventController } from "../controllers/subscriptionController.js";
const router = express.Router();
router.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);
router.post("/subscription", handleSubscriptionEventController);
export default router;
