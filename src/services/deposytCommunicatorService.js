// deposytCommunicatorService.js
import axios from "axios";
import { PlansConfig } from "../config/plansConfig.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { parseGatewayResponse } from "../utils/paymentUtils.js";
import { parseStringPromise } from "xml2js";

const { DEPOSYT_PAYMENT_URL, DEPOSYT_QUERY_URL } = PlansConfig;

const getApiKeyOrThrow = () => {
  const key = process.env.DEPOSYT_PRIVATE_API_KEY;
  if (!key) {
    throw new AppError(
      "DEPOSYT_PRIVATE_API_KEY is not set",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
  return key;
};

/**
 * 1) Create subscription + take first payment
 *    - Uses transact.php (DEPOSYT_PAYMENT_URL)
 *    - You pass: amount, currency, paymentToken, planId, email?, orderId?
 *    - Returns parsed gateway response (subscription_id, customer_vault_id, etc.)
 */
export const createGatewaySubscription = async ({
  amount,
  currency,
  paymentToken,
  planId,
  email,
  orderId,
}) => {
  const securityKey = getApiKeyOrThrow();

  if (!amount || !Number.isFinite(Number(amount))) {
    throw new AppError(
      "Invalid subscription amount",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
  if (!currency) {
    throw new AppError("Missing currency", 400, ErrorCodes.BAD_REQUEST);
  }
  if (!paymentToken) {
    throw new AppError("Missing payment token", 400, ErrorCodes.BAD_REQUEST);
  }
  if (!planId) {
    throw new AppError("Missing plan id", 400, ErrorCodes.BAD_REQUEST);
  }

  const payload = new URLSearchParams();
  payload.append("security_key", securityKey);
  payload.append("type", "sale");
  payload.append("amount", Number(amount).toFixed(2));
  payload.append("currency", currency);
  payload.append("payment_token", paymentToken);

  // recurring subscription setup
  payload.append("billing_method", "recurring");
  payload.append("recurring", "add_subscription");
  payload.append("plan_id", String(planId));

  if (email) {
    payload.append("email", email);
  }
  if (orderId) {
    payload.append("orderid", orderId);
  }
  // optional: customer receipt
  payload.append("customer_receipt", "true");

  const response = await axios.post(DEPOSYT_PAYMENT_URL, payload.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  console.log(response.status);
  const parsed = parseGatewayResponse(response.data);
  console.log(parsed);
  if (parsed.response !== "1") {
    throw new AppError(
      "Payment information is invalid. Please try again.",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  // typical fields: subscription_id, customer_vault_id, transactionid, etc.
  return parsed;
};

/**
 * 2) Pause / unpause an existing subscription
 *    - Uses transact.php (DEPOSYT_PAYMENT_URL)
 *    - paused = true  => paused_subscription = "true"
 *      paused = false => paused_subscription = "false"
 */
export const pauseGatewaySubscription = async (subscriptionId, paused) => {
  const securityKey = getApiKeyOrThrow();

  if (!subscriptionId) {
    throw new AppError("Missing subscription_id", 400, ErrorCodes.BAD_REQUEST);
  }

  const payload = new URLSearchParams();
  payload.append("security_key", securityKey);
  payload.append("recurring", "update_subscription");
  payload.append("subscription_id", subscriptionId);
  payload.append("paused_subscription", paused ? "true" : "false");

  const response = await axios.post(DEPOSYT_PAYMENT_URL, payload.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const parsed = parseGatewayResponse(response.data);

  if (parsed.response !== "1") {
    throw new AppError(
      parsed.responsetext || "Gateway did not approve pause/update.",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  return parsed;
};

/**
 * 3) Update subscription's payment method directly
 *    - Uses transact.php (DEPOSYT_PAYMENT_URL)
 *    - We send payment_token on update_subscription so Deposyt applies the new card
 */
export const updateGatewaySubscriptionPayment = async ({
  subscriptionId,
  paymentToken,
  paused,
}) => {
  const securityKey = getApiKeyOrThrow();

  if (!subscriptionId) {
    throw new AppError("Missing subscription_id", 400, ErrorCodes.BAD_REQUEST);
  }
  if (!paymentToken) {
    throw new AppError("Missing payment token", 400, ErrorCodes.BAD_REQUEST);
  }

  const payload = new URLSearchParams();
  payload.append("security_key", securityKey);
  payload.append("recurring", "update_subscription");
  payload.append("subscription_id", subscriptionId);
  if (paymentToken) {
    payload.append("payment_token", paymentToken);
  }
  if (paused) {
    payload.append("paused_subscription", paused ? "true" : "false");
  }

  const response = await axios.post(DEPOSYT_PAYMENT_URL, payload.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const parsed = parseGatewayResponse(response.data);

  if (parsed.response !== "1") {
    throw new AppError(
      paymentToken ? "Payment information is invalid. Please try again." : "Subscription update failed. Please try again.",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  return parsed;
};

/**
 * 4) Get subscription details (status, dates, etc.)
 *    - Uses query.php (DEPOSYT_QUERY_URL)
 *    - Deposyt/NMI query.php returns XML
 *    - Here we return raw XML; you can parse status/fields in a higher layer.
 *
 *    NOTE: Exact query parameters depend on Deposyt/NMI docs.
 *    Common pattern is something like:
 *      - security_key
 *      - report_type / recurring / subscription_id
 *
 *    Adjust report_type/fields if your docs differ.
 */
export const getGatewaySubscriptionDetails = async (subscriptionId) => {
  const securityKey = getApiKeyOrThrow();

  if (!subscriptionId) {
    throw new AppError(
      "subscriptionId is required",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  // Build query payload – using query.php
  const payload = new URLSearchParams();
  payload.append("security_key", securityKey);

  // Filter by subscription_id (adjust if your integration uses another filter)
  payload.append("subscription_id", subscriptionId);

  let xml;
  try {
    const response = await axios.post(DEPOSYT_QUERY_URL, payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    xml = response.data;
  } catch (err) {
    // Network / HTTP-level failure
    throw new AppError(
      "Failed to query Deposyt subscription details",
      502,
      ErrorCodes.BAD_GATEWAY,
      { cause: err }
    );
  }

  try {
    // Parse XML into a JS object. We don't enforce any specific shape.
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      trim: true,
    });

    // You’ll typically get something like:
    // { nm_response: { transaction: {...} } }
    return parsed;
  } catch (err) {
    throw new AppError(
      "Failed to parse Deposyt subscription XML response",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      { cause: err }
    );
  }
};
