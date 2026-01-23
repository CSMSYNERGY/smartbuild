// tiny helper to parse Deposyt's query-string style response

export const parseGatewayResponse = (body) => {
  // body: "response=1&responsetext=Approved&transactionid=123..."
  const params = new URLSearchParams(body);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
};

export const computeSubscriptionEndDate = (eventBody, existingSub) => {
  const nextChargeDateStr = eventBody.next_charge_date;

  if (nextChargeDateStr) {
    // Deposyt sends e.g. "2025-02-10"
    // We'll store it as a timestamp (ms since epoch)
    return new Date(nextChargeDateStr).getTime();
  }

  // If gateway doesn't send it for some reason, keep what we had
  return existingSub?.subscriptionEndDate ?? null;
};

export const isPlanValid = (eventBody, plans) => {
  // First, try to get plan ID from Deposyt's plan object
  const planIdFromGateway = eventBody?.plan?.id || null;
  
  // Fallback: extract plan ID from order_id if available
  // order_id format: "sub-<locationId>-<planId>-<timestamp...>"
  const orderId = eventBody?.order_id;
  let planIdFromOrderId = null;
  if (orderId) {
    const parsed = parseOrderId(orderId);
    planIdFromOrderId = parsed?.planId || null;
  }

  // Check if either plan ID matches any of our configured plans
  const planId = planIdFromGateway || planIdFromOrderId;
  return planId ? plans.find((plan) => plan.id === planId) != null : false;
};

export const createOrderId = (locationId, planId) => {
  return `sub-${locationId}-${planId}-${Date.now()}`;
};

export const parseOrderId = (orderId) => {
  if (!orderId || typeof orderId !== "string") return null;
  if (!orderId.startsWith("sub-")) return null;

  const parts = orderId.split("-");
  // "sub-<locationId>-<planId>-<timestamp...>"
  if (parts.length < 3) return null;

  const locationId = parts[1];
  const planId = parts[2];

  return { locationId, planId };
};
