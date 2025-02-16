export const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.GHL_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
  }

  next();
};
