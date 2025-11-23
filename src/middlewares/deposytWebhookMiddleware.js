import crypto from "crypto";
import { AppError, ErrorCodes } from "../models/errors.js";
import logger from "../config/logger.js";
export const verifyDeposytSigningKey = (req, res, next) => {
  try {
    // Header names are case-insensitive; Express normalizes them to lowercase internally
    const signatureHeader =
      req.get("Webhook-Signature") || req.get("webhook-signature");

    if (!signatureHeader) {
      throw new AppError(
        "Unauthorized: Missing webhook signature",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    const signingKey = process.env.DEPOSYT_WEBHOOK_SIGNING_KEY;
    if (!signingKey) {
      // This is a server misconfiguration, not a client auth problem
      throw new AppError(
        "Server misconfiguration: missing DEPOSYT_WEBHOOK_SIGNING_KEY",
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
    logger.info("Deposyt webhook signature verification", {
      signingKey,
      signatureHeader,
    }); //remove in prod

    const receivedBuf = Buffer.from(signatureHeader, "utf8");
    const expectedBuf = Buffer.from(signingKey, "utf8");

    if (
      receivedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      throw new AppError(
        "Unauthorized: Invalid webhook signature",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
