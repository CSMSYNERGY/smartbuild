// subscriptionService.js
import {
  getEntitlement,
  getSubscription,
  saveEntitlement,
  saveSubscription,
  deleteEntitlement,
  deleteSubscription,
} from "./firestoreService.js";
import { PlansConfig } from "../config/plansConfig.js";
import { ErrorCodes } from "../models/errors.js";
import {
  computeSubscriptionEndDate,
  isPlanValid,
  parseOrderId,
} from "../utils/paymentUtils.js";
import logger from "../config/logger.js";
import { AppError } from "../models/errors.js";
import {
  updateGatewaySubscriptionPayment,
  createGatewaySubscription,
  pauseGatewaySubscription,
  getGatewaySubscriptionDetails,
} from "./deposytCommunicatorService.js";

export const getEntitlementDetails = async (webUser) => {
  try {
    const base = await getEntitlementDetailsForLocation(webUser.locationId);

    const subscriptionByThisUser =
      base.entitlementUserId && base.entitlementUserId === webUser.id;

    let paymentDetails = null;

    // Only fetch and expose payment details if this user owns the subscription
    // and there is a subscriptionId we can look up.
    if (subscriptionByThisUser && base.subscriptionId) {
      try {
        const sub = await getSubscription(base.subscriptionId);
        if (sub && sub.paymentDetails) {
          paymentDetails = sub.paymentDetails;
        }
      } catch (err) {
        logger.warn(
          `Failed to load subscription/payment details for ${base.subscriptionId}`,
          err
        );
      }
    }

    return {
      status: base.status,
      subscriptionByThisUser,
      planId: base.planId,
      activeUntil: base.activeUntil ?? null,
      paymentDetails,
    };
  } catch (error) {
    logger.error("Error getting subscription entitlement", error);
    throw new Error("Error getting subscription entitlement");
  }
};

export const getEntitlementDetailsForLocation = async (locationId) => {
  try {
    const entitlement = await getEntitlement(locationId);

    // No entitlement at all → inactive
    if (!entitlement) {
      return {
        status: "inactive",
        planId: undefined,
        activeUntil: null,
        entitlementUserId: null,
        subscriptionId: null,
      };
    }

    const entitlementUserId = entitlement.userId || null;
    const planId = entitlement.planId;
    const status = entitlement.status || "inactive";

    // Normalize subscriptionEndDate to ms timestamp
    const rawEnd = entitlement.subscriptionEndDate;
    let subscriptionEndMs = null;
    if (typeof rawEnd === "number") {
      subscriptionEndMs = rawEnd;
    } else if (rawEnd && typeof rawEnd.toMillis === "function") {
      // Firestore Timestamp
      subscriptionEndMs = rawEnd.toMillis();
    } else if (rawEnd instanceof Date) {
      subscriptionEndMs = rawEnd.getTime();
    }

    const now = Date.now();

    // 1) Active → just return active
    if (status === "active") {
      return {
        status: "active",
        planId,
        activeUntil: subscriptionEndMs ?? null,
        entitlementUserId,
        subscriptionId: entitlement.subscriptionId,
      };
    }

    // 2) Pending-cancel → we know user requested cancel,
    // but we may not yet have the final end date from webhook.
    if (status.includes("pending")) {
      return {
        status: status,
        planId,
        activeUntil: subscriptionEndMs ?? null,
        entitlementUserId,
        subscriptionId: null,
      };
    }

    // 3) Cancelled → check if period is still running
    if (status === "cancelled") {
      if (subscriptionEndMs && subscriptionEndMs > now) {
        // Cancelled but still in paid period
        return {
          status: "cancelled",
          planId,
          activeUntil: subscriptionEndMs,
          entitlementUserId,
          subscriptionId: null,
        };
      }

      if (subscriptionEndMs && subscriptionEndMs <= now) {
        // Cancelled and end date passed → hard-expire entitlement
        await deleteEntitlement(locationId);

        return {
          status: "inactive",
          planId: undefined,
          activeUntil: null,
          entitlementUserId: null,
          subscriptionId: null,
        };
      }

      // Cancelled but we don't know end date (defensive fallback)
      return {
        status: "cancelled",
        planId,
        activeUntil: null,
        entitlementUserId,
        subscriptionId: null,
      };
    }

    // 4) Any other status (expired, etc.) → treat as inactive
    return {
      status: "inactive",
      planId: undefined,
      activeUntil: null,
      entitlementUserId,
      subscriptionId: null,
    };
  } catch (error) {
    logger.error(
      `Error getting subscription entitlement for location ${locationId}`,
      error
    );
    throw new Error("Error getting subscription entitlement for location");
  }
};

export const cancelSubscription = async (user) => {
  const DEPOSYT_PRIVATE_API_KEY = process.env.DEPOSYT_PRIVATE_API_KEY;

  if (!DEPOSYT_PRIVATE_API_KEY) {
    throw new AppError(
      "DEPOSYT_PRIVATE_API_KEY is not set",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
  if (!user || !user.id || !user.locationId) {
    throw new AppError(
      "User or location missing from session",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  // Get subscription for this location (or for this user if you prefer)
  const entitlement = await getEntitlement(user.locationId);

  if (!entitlement || entitlement.status !== "active") {
    throw new AppError(
      "No active subscription found",
      404,
      ErrorCodes.NOT_FOUND
    );
  }

  const { subscriptionId } = entitlement;

  if (!subscriptionId) {
    throw new AppError(
      "Subscription ID missing for this location",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  await pauseGatewaySubscription(subscriptionId, true);

  const now = Date.now();

  await saveEntitlement(user.locationId, {
    status: "pending-cancel",
    updatedAt: now,
  });

  await saveSubscription(subscriptionId, {
    status: "pending-cancel",
    updatedAt: now,
  });

  return { ok: true, status: "pending-cancel" };
};

export const updatePayment = async (user, paymentToken) => {
  // Get entitlement
  const entitlement = await getEntitlement(user.locationId);

  const subscriptionId = entitlement.subscriptionId;

  const subscription = await getSubscription(subscriptionId);

  if (!subscription) {
    throw new AppError(
      "Subscription record not found",
      404,
      ErrorCodes.NOT_FOUND
    );
  }

  await updateGatewaySubscriptionPayment({
    subscriptionId,
    paymentToken,
    paused: false,
  });

  await saveEntitlement(user.locationId, {
    status: "pending-update-payment",
    updatedAt: Date.now(),
  });

  return { ok: true };
};

export const resumeSubscription = async (user) => {
  // Get entitlement
  const { subscriptionId, subscriptionByThisUser, status } =
    await getEntitlementDetails(user);

  if (status === "active") {
    throw new AppError(
      "Subscription is already active",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  await updateGatewaySubscriptionPayment({
    subscriptionId,
    paymentToken: null,
    paused: false,
  });

  await saveEntitlement(user.locationId, {
    status: "pending-resume",
    updatedAt: Date.now(),
  });

  return { ok: true };
};

export const getSavedPlans = () => {
  return PlansConfig.PLANS;
};

export const createSubscription = async (user, paymentToken, planId) => {
  if (!user || !user.id || !user.locationId) {
    throw new AppError(
      "User or location is missing from session",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  // Validate / resolve plan
  const plan = PlansConfig.PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new AppError("Invalid plan id", 400, ErrorCodes.BAD_REQUEST);
  }

  // Amount per cycle (in your currency)
  const amount = Number(plan.amount);
  if (!Number.isFinite(amount)) {
    throw new AppError(
      "Configured plan amount is invalid",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  if (process.env.NODE_ENV === "development") {
    logger.info(`Creating subscription, paymentToken: ${paymentToken} orderId`);
  }

  const parsed = await createGatewaySubscription({
    amount,
    currency: plan.currency,
    paymentToken,
    planId,
    email: user.email,
    orderId: `sub-${user.locationId}-${planId}-${Date.now()}`,
  });

  if (process.env.NODE_ENV === "development") {
    logger.info(`Subscription request sent and parsed:`, parsed);
  }

  const subscriptionId = parsed.subscription_id;
  const orderId = parsed.orderid;

  if (!subscriptionId) {
    throw new AppError(
      "Subscription ID is missing",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const now = Date.now();
  const status = "active";

  // 1) Entitlement doc keyed by locationId
  await saveEntitlement(user.locationId, {
    id: user.locationId,
    status,
    subscriptionId,
    userId: user.id,
    planId,
    updatedAt: now,
    createdAt: now,
  });

  return {
    ok: true,
    subscriptionId,
    status,
    orderId,
  };
};

/**
 * Top-level dispatcher called from your controller.
 * @param {string} eventType  e.g. "recurring.subscription.add"
 * @param {object} eventBody  the JSON from Deposyt's event_body
 */
export const handleSubscriptionEvent = async (eventType, eventBody) => {
  // Sanity check
  if (!eventBody || typeof eventBody !== "object") {
    logger.warn("handleSubscriptionEvent called with empty eventBody");
    return;
  }

  // Make sure this is one of *your* plans (you already implemented this)
  if (!isPlanValid(eventBody, PlansConfig.PLANS)) {
    logger.info(
      `Ignoring Deposyt webhook for non-app plan: ${eventBody?.plan?.id}`
    );
    return;
  }

  logger.info(
    `Deposyt webhook received for eventType: ${eventType}`,
    eventBody
  );

  switch (eventType) {
    case "recurring.subscription.delete":
      await handleSubscriptionDeleted(eventBody);
      break;
    case "recurring.subscription.update":
      await handleSubscriptionUpdated(eventBody);
      break;
    case "recurring.subscription.add":
      await handleSubscriptionAdded(eventBody);
      break;
    default:
      logger.warn(
        `Unknown event type received from Deposyt: ${eventType}`,
        eventBody
      );
      return;
  }
};

const handleSubscriptionAdded = async (eventBody) => {
  const subscriptionId = eventBody.subscription_id;
  if (!subscriptionId) {
    logger.warn("subscription.add event missing subscription_id", eventBody);
    return;
  }

  const orderId = eventBody.order_id;
  if (!orderId) {
    logger.warn("subscription.add event missing order_id", eventBody);
    return;
  }

  const { locationId: locationIdFromOrderId, planId: planIdFromOrderId } =
    parseOrderId(orderId);
  if (!locationIdFromOrderId) {
    logger.warn(
      `subscription.add event missing locationId. orderid: ${orderId}`
    );
    return;
  }

  const planIdFromGateway = eventBody.plan?.id || null;
  const now = Date.now();

  const entitlementId = locationIdFromOrderId; // locationId from createSubscription
  const planId = planIdFromGateway || planIdFromOrderId;

  const subscriptionEndDate = computeSubscriptionEndDate(eventBody, null);

  //  derive payment details from webhook payload (masked only)
  const card = eventBody.card || {};
  const billing = eventBody.billing_address || {};

  const paymentDetails = {
    maskedNumber: typeof card.cc_number === "string" ? card.cc_number : null,
    exp: card.cc_exp || null, // e.g. "1026"
    billingName:
      [billing.first_name, billing.last_name].filter(Boolean).join(" ") || null,
    billingEmail: billing.email || null,
  };

  // Mark subscription as active and sync end date
  await saveSubscription(subscriptionId, {
    id: subscriptionId,
    planId,
    status: "active",
    nextChargeDate: subscriptionEndDate,
    subscriptionEndDate,
    orderId,
    entitlementId,
    paymentDetails,
    gatewayPlanName: eventBody.plan?.name,
    gatewayPlanAmount: eventBody.plan?.amount,
    createdAt: now,
    updatedAt: now,
  });

  // Entitlement: active, and now has subscriptionEndDate = next_charge_date
  await saveEntitlement(entitlementId, {
    id: entitlementId,
    status: "active",
    subscriptionId,
    planId,
    subscriptionEndDate,
    updatedAt: now,
  });

  const gatewaySubscriptionDetails = await getGatewaySubscriptionDetails(
    subscriptionId
  );
  if (!gatewaySubscriptionDetails) {
    logger.warn(
      `Webhook add for unknown subscription_id=${subscriptionId}, skipping entitlement update on add.`
    );
    return;
  }

  logger.info(
    `Sub details retrieved from gateway for sub=${subscriptionId}`,
    gatewaySubscriptionDetails
  );
};

const handleSubscriptionUpdated = async (eventBody) => {
  const subscriptionId = eventBody.subscription_id;
  if (!subscriptionId) {
    logger.warn("subscription.update event missing subscription_id", eventBody);
    return;
  }

  const planIdFromGateway = eventBody.plan?.id || null;
  const now = Date.now();

  const existingSub = await getSubscription(subscriptionId);
  if (!existingSub) {
    logger.warn(
      `Webhook update for unknown subscription_id=${subscriptionId}, saving stub subscription`
    );
  }
  const gatewaySubscriptionDetails = await getGatewaySubscriptionDetails(
    subscriptionId
  );
  if (!gatewaySubscriptionDetails) {
    logger.warn(
      `Webhook update for unknown subscription_id=${subscriptionId}, skipping entitlement update on update.`
    );
    return;
  }

  logger.info(
    `Deposyt gateway subscription details for sub=${subscriptionId}`,
    gatewaySubscriptionDetails
  );

  const entitlementId = existingSub?.entitlementId;
  const planId = planIdFromGateway || existingSub?.planId;

  const subscriptionEndDate = computeSubscriptionEndDate(
    eventBody,
    existingSub
  );

  // If already cancelled in our DB, don't revive it here.
  const status =
    existingSub?.status && existingSub.status === "cancelled"
      ? "cancelled"
      : "active";

  //  derive payment details from webhook payload (masked only)
  const card = eventBody.card || {};
  const billing = eventBody.billing_address || {};

  const paymentDetails = {
    maskedNumber: typeof card.cc_number === "string" ? card.cc_number : null,
    exp: card.cc_exp || null, // e.g. "1026"
    billingName:
      [billing.first_name, billing.last_name].filter(Boolean).join(" ") || null,
    billingEmail: billing.email || null,
  };

  await saveSubscription(subscriptionId, {
    id: subscriptionId,
    planId,
    status,
    nextChargeDate: subscriptionEndDate,
    subscriptionEndDate,
    gatewayPlanName: eventBody.plan?.name,
    gatewayPlanAmount: eventBody.plan?.amount,
    paymentDetails,
    createdAt: existingSub?.createdAt ?? now,
    updatedAt: now,
  });

  if (!entitlementId) {
    logger.warn(
      `Subscription ${subscriptionId} has no entitlementId; skipping entitlement update on update.`
    );
    return;
  }

  // Entitlement status mirrors subscription, but we still bump subscriptionEndDate
  await saveEntitlement(entitlementId, {
    id: entitlementId,
    status,
    subscriptionId,
    planId,
    subscriptionEndDate,
    updatedAt: now,
  });
};

const handleSubscriptionDeleted = async (eventBody) => {
  const subscriptionId = eventBody.subscription_id;
  if (!subscriptionId) {
    logger.warn("subscription.delete event missing subscription_id", eventBody);
    return;
  }

  const existingSub = await getSubscription(subscriptionId);
  if (existingSub) {
    await deleteSubscription(subscriptionId);
  }
};
