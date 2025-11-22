// webApiController.js
import {
  getEntitlementDetails,
  createSubscription,
  cancelSubscription,
} from "../services/subscriptionService.js";
import { getSavedPlans } from "../services/subscriptionService.js";
import logger from "../config/logger.js";

export const getWebUserController = async (req, res) => {
  try {
    const user = req.webUser;
    const entitlement = await getEntitlementDetails(user);
    res.json({ user, entitlement });
  } catch (error) {
    console.error("Error getting web user", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPlansController = async (req, res) => {
  try {
    const plans = getSavedPlans();
    res.json(plans);
  } catch (error) {
    logger.error("Error getting plans", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createSubscriptionController = async (req, res) => {
  try {
    const user = req.webUser;
    const { paymentToken, planId } = req.body;
    if (!paymentToken || !planId) {
      return res
        .status(400)
        .json({ error: "Payment token and plan id are required" });
    }
    const result = await createSubscription(user, paymentToken, planId);
    res.json(result);
  } catch (error) {
    logger.error("Error creating subscription", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelSubscriptionController = async (req, res) => {
  try {
    const user = req.webUser;
    const result = await cancelSubscription(user);
    res.json(result);
  } catch (error) {
    logger.error("Error canceling subscription", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
