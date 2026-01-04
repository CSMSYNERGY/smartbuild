// webApiController.js
import {
  getEntitlementDetails,
  createSubscription,
  cancelSubscription,
  updatePayment,
} from "../services/subscriptionService.js";
import { getSavedPlans } from "../services/subscriptionService.js";
import logger from "../config/logger.js";
import { checkLocationAuthorization } from "../services/authService.js";
import {
  authenticateSmartbuild,
  getSmartbuildAuthentication,
} from "../services/smartbuildService.js";
import {
  getMappersForLocation,
  getMapperForLocation,
  createMapperForLocation,
  updateMapperForLocation,
  deleteMapperForLocation,
} from "../services/mappersService.js";
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

export const getSmartbuildConfigurationnController = async (req, res) => {
  const locationId = req.webUser.locationId;
  let authData = null;
  try {
    authData = await getSmartbuildAuthentication(locationId);
  } catch (error) {
    logger.warn(
      `SmartBuild auth for location unavailable: ${locationId}`,
      error
    );
  }
  res.status(200).json({
    connected: authData != null,
    smartbuildUserId: authData?.smartbuildUserId,
  });
};

export const getMappersController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const mappers = await getMappersForLocation(locationId);
  res.status(200).json(mappers);
};

export const getMapperController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const mapperId = req.params.mapperId;
  const mapper = await getMapperForLocation(locationId, mapperId);
  res.status(200).json(mapper);
};

export const createMapperController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const { name, type } = req.body;
  const mapperId = await createMapperForLocation(locationId, name, type);
  res.status(200).json({ id: mapperId });
};

export const updateMapperController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const mapperId = req.params.mapperId;
  const { name, type } = req.body;
  const mapper = await updateMapperForLocation(
    locationId,
    mapperId,
    name,
    type
  );
  res.status(200).json(mapper);
};

export const deleteMapperController = async (req, res) => {
  const locationId = req.webUser.locationId;
  const mapperId = req.params.mapperId;
  await deleteMapperForLocation(locationId, mapperId);
  res.status(200).json({ ok: true });
};
