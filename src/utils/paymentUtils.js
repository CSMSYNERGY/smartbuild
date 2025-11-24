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
  const planId = eventBody?.plan?.id;

  return planId ? plans.find((plan) => plan.id === planId) != null : false;
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
