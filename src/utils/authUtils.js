import { AppError, ErrorCodes } from "../models/errors.js";

export const hasRequiredScopes = (userScopeString) => {
  if (!userScopeString) return false;

  // Convert the user's scope string into an array
  const userScopes = new Set(userScopeString.split(" "));

  // Retrieve required scopes from the environment variable
  const requiredScopes = process.env.GHL_SCOPES?.split(" ") || [];

  // Check if all required scopes exist in the user's scopes
  return requiredScopes.every((scope) => userScopes.has(scope));
};

export const isTokenExpired = (expires) => {
  if (!expires) {
    throw new Error("Invalid token data: Missing expires timestamp");
  }

  const currentTime = new Date();
  return currentTime >= expires.toDate();
};

export const getLocationIdFromRequest = (req) => {
  const locationId = req.headers["locationid"] || req.query.locationId;
  if (!locationId) {
    throw new AppError("No location id provided", 400, ErrorCodes.BAD_REQUEST);
  }
  return locationId;
};
