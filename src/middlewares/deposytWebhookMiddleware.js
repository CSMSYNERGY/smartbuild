import crypto from "crypto";
import { AppError, ErrorCodes } from "../models/errors.js";
import logger from "../config/logger.js";
export const verifyDeposytSigningKey = (req, res, next) => {
  try {
    // Header names are case-insensitive; Express normalizes to lowercase
    const signatureHeader =
      req.get("Webhook-Signature") ||
      req.get("webhook-signature") ||
      req.get("X-Webhook-Signature") ||
      req.get("x-webhook-signature");

    if (!signatureHeader) {
      throw new AppError(
        "Unauthorized: Missing webhook signature",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    const signingKey = process.env.DEPOSYT_WEBHOOK_SIGNING_KEY;
    if (!signingKey) {
      throw new AppError(
        "Server misconfiguration: missing DEPOSYT_WEBHOOK_SIGNING_KEY",
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }

    // Example header: "t=1763924400,s=7e1d9d70eb5c8b8b3dc6..."
    const parts = signatureHeader.split(",").map((p) => p.trim());
    const tPart = parts.find((p) => p.startsWith("t="));
    const sPart = parts.find((p) => p.startsWith("s="));

    if (!tPart || !sPart) {
      throw new AppError(
        "Unauthorized: Malformed webhook signature header",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    const timestamp = parseInt(tPart.slice(2), 10);
    const receivedSignature = sPart.slice(2);

    if (!Number.isFinite(timestamp)) {
      throw new AppError(
        "Unauthorized: Invalid webhook timestamp",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Optional: replay protection (5 minutes window)
    const now = Math.floor(Date.now() / 1000);
    const maxAgeSeconds = 5 * 60;
    if (Math.abs(now - timestamp) > maxAgeSeconds) {
      throw new AppError(
        "Unauthorized: Webhook timestamp too old",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // IMPORTANT: req.rawBody should be set by your body parser:
    // app.use(express.json({
    //   verify: (req, res, buf) => { req.rawBody = buf.toString('utf8'); }
    // }))
    const rawBody =
      typeof req.rawBody === "string"
        ? req.rawBody
        : JSON.stringify(req.body || {});

    const payloadToSign = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", signingKey)
      .update(payloadToSign, "utf8")
      .digest("hex");

    const receivedBuf = Buffer.from(receivedSignature, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");

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

    logger.info("Deposyt webhook signature verified successfully");
    next();
  } catch (error) {
    next(error);
  }
};
