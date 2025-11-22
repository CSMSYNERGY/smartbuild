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

export const isPlanValid = (eventBody) => {
  const planId = eventBody?.plan?.id;

  return planId
    ? PlansConfig.PLANS.find((plan) => plan.id === planId) != null
    : false;
};
