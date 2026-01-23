export const PlansConfig = {
  DEPOSYT_PAYMENT_URL: "https://deposyt.transactiongateway.com/api/transact.php",
  DEPOSYT_QUERY_URL: "https://deposyt.transactiongateway.com/api/query.php",
  PLANS: [
    {
      id: "CPI_MONTHLY",
      name: "Construction Platform Integrations Monthly Subscription",
      amount: 250,
      currency: "USD",
      frequency: "month",
      description: "Construction Platform Integrations Monthly Subscription",
    },
    {
      id: "CPI_YEARLY",
      name: "Construction Platform Integrations Yearly Subscription",
      amount: 2500,
      currency: "USD",
      frequency: "year",
      description: "Construction Platform Integrations Yearly Subscription",
    }
  ],
};
