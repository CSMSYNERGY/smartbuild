import logger from "../config/logger.js";
import { GHL_WEBHOOK_PUBLIC_KEY } from "../constants/authConstants.js";

export const verifyWebhook = (req, res, next) => {
  try {
    const signature = req.headers["x-wh-signature"];
    if (!signature) {
      return res.status(401).json({ error: "Unauthorized: Missing Signature" });
    }
    const payload = JSON.stringify(req.body);
    const verifier = crypto.createVerify("SHA256");
    verifier.update(payload);
    verifier.end();
    const isValid = verifier.verify(GHL_WEBHOOK_PUBLIC_KEY, signature, "base64");
    if (!isValid) {
      return res.status(401).json({ error: "Unauthorized: Invalid Signature" });
    }
    next(); 
  } catch (error) {
    logger.error("Webhook verification failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};