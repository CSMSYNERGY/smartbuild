// subscriptionController.js
import { handleSubscriptionEvent } from "../services/subscriptionService.js";
import logger from "../config/logger.js";

export const handleSubscriptionEventController = async (req, res) => {
  try {
    const { event_type, event_body } = req.body; // already parsed JSON

    await handleSubscriptionEvent(event_type, event_body);

    return res.status(200).json({ ok: true });
  } catch (error) {
    logger.error("Error handling Deposyt webhook", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
