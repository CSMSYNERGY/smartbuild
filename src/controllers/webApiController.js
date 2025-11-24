// webApiController.js
import {
  getEntitlementDetails,
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  updatePayment,
} from "../services/subscriptionService.js";
import { getSavedPlans } from "../services/subscriptionService.js";
import logger from "../config/logger.js";
import {
  checkLocationAuthorization,
  authenticateSmartbuild,
} from "../services/authService.js";
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
  const user = req.webUser;
  const { paymentToken, planId } = req.body;
  if (!paymentToken || !planId) {
    return res
      .status(400)
      .json({ error: "Payment token and plan id are required" });
  }
  const result = await createSubscription(user, paymentToken, planId);
  res.json(result);
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

export const resumeSubscriptionController = async (req, res) => {
  try {
    const user = req.webUser;
    const result = await resumeSubscription(user);
    res.json(result);
  } catch (error) {
    logger.error("Error resuming subscription", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePaymentController = async (req, res) => {
  try {
    const user = req.webUser;
    const { paymentToken } = req.body;
    const result = await updatePayment(user, paymentToken);
    res.json(result);
  } catch (error) {
    logger.error("Error updating payment", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const checkLocationAuthorizationController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const result = await checkLocationAuthorization(locationId);
  res.status(200).json({ authorized: result });
};

export const authenticateSmartbuildController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const { smartbuildUserId, smartbuildUserPassword } = req.body;
  if (!smartbuildUserId || !smartbuildUserPassword) {
    return res
      .status(400)
      .json({ error: "Smartbuild user id and password are required" });
  }
  await authenticateSmartbuild(
    locationId,
    smartbuildUserId,
    smartbuildUserPassword
  );
  res.status(200).json({
    ok: true,
  });
};
