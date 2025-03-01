import { GHL_WEBHOOK_PUBLIC_KEY } from "../constants/authConstants.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import crypto from "crypto";

export const verifyWebhook = (req, res, next) => {
  try {
    const signature = req.headers["x-wh-signature"];
    if (!signature) {
      throw new AppError(
        "Unauthorized: Missing Signature",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }
    const payload = JSON.stringify(req.body);
    const verifier = crypto.createVerify("SHA256");
    verifier.update(payload);
    verifier.end();
    const isValid = verifier.verify(
      GHL_WEBHOOK_PUBLIC_KEY,
      signature,
      "base64"
    );
    if (!isValid) {
      throw new AppError(
        "Unauthorized: Invalid Signature",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const verifyAPIKey = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"]; // Extract API key from request headers

    if (!apiKey) {
      throw new AppError(
        "Unauthorized: Missing API KEY",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    const validApiKey = process.env.X_API_KEY;

    const isValid = crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(validApiKey)
    );

    if (!isValid) {
      throw new AppError(
        "Unauthorized: Invalid API KEY",
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
