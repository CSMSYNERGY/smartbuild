import expressAsyncHandler from "express-async-handler";
import { AppError, ErrorCodes } from "../models/errors.js";

export const wrapAsync = (router) => {
  const wrap = (fn) => expressAsyncHandler(fn);

  // Store the original route methods
  const methods = ["get", "post", "put", "delete", "patch", "use"];

  methods.forEach((method) => {
    const original = router[method].bind(router);
    router[method] = function (path, ...handlers) {
      handlers = handlers.map((handler) => {
        // If it's a router (has .route property), wrap it recursively
        if (handler && handler.route) {
          return wrapAsync(handler);
        }
        // If it's a function, wrap it with expressAsyncHandler
        return typeof handler === "function" ? wrap(handler) : handler;
      });
      return original(path, ...handlers);
    };
  });

  // Also wrap any existing routes
  if (router.stack) {
    router.stack.forEach((layer) => {
      if (layer.route) {
        layer.route.stack.forEach((routeLayer) => {
          if (typeof routeLayer.handle === "function") {
            routeLayer.handle = wrap(routeLayer.handle);
          }
        });
      } else if (layer.handle && layer.handle.route) {
        wrapAsync(layer.handle);
      }
    });
  }

  return router;
};

export const validateAndCleanQuery = (query) => {
  if (query == null) {
    throw new AppError("Query is required", 400, ErrorCodes.BAD_REQUEST);
  }

  // Remove URL-unsafe and special characters, keep alphanumeric, spaces, hyphens, underscores
  const cleanedQuery = String(query)
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedQuery.length < 3) {
    throw new AppError(
      "Query must be at least 3 characters",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  return cleanedQuery;
};

export const validatePageAndLimit = (page, limit) => {
  if (page == null || limit == null) {
    throw new AppError(
      "Page and limit are required",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
    throw new AppError(
      "Page must be a positive integer greater than 0",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  if (isNaN(limitNum) || !Number.isInteger(limitNum) || limitNum < 1) {
    throw new AppError(
      "Limit must be a positive integer greater than 0",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  return { page: pageNum, limit: limitNum };
};

/**
 * Validates object properties array for mapper configuration.
 * @param {any} objectProperties - The properties to validate
 * @param {number} maxProperties - Maximum number of properties allowed (default: 10)
 * @returns {string[]} - Validated and cleaned array of property strings
 * @throws {AppError} - If validation fails
 */
export const validateObjectProperties = (
  objectProperties,
  maxProperties = 10
) => {
  // Return empty array if not provided (optional field)
  if (objectProperties == null) {
    return [];
  }

  if (!Array.isArray(objectProperties)) {
    throw new AppError(
      "Object properties must be an array",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  if (objectProperties.length === 0) {
    return [];
  }

  if (objectProperties.length > maxProperties) {
    throw new AppError(
      `Object properties cannot exceed ${maxProperties} items`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  // Validate each property is a non-empty string
  for (let i = 0; i < objectProperties.length; i++) {
    const property = objectProperties[i];

    if (typeof property !== "string") {
      throw new AppError(
        `Object property at index ${i} must be a string`,
        400,
        ErrorCodes.BAD_REQUEST
      );
    }

    const trimmed = property.trim();
    if (trimmed.length === 0) {
      throw new AppError(
        `Object property at index ${i} cannot be empty`,
        400,
        ErrorCodes.BAD_REQUEST
      );
    }
  }

  // Return cleaned array with trimmed strings
  return objectProperties.map((p) => p.trim());
};

export const validateValueProperties = (value, objectConfiguration) => {
  if (value == null || typeof value !== "object") {
    throw new AppError("Value must be an object", 400, ErrorCodes.BAD_REQUEST);
  }
  const objectKeys = Object.keys(objectConfiguration);
  Object.keys(value).forEach((key) => {
    if (!objectKeys.includes(key)) {
      throw new AppError(
        `Invalid value property: ${key}`,
        400,
        ErrorCodes.BAD_REQUEST
      );
    }
    if (typeof value[key] !== "string") {
      throw new AppError(
        `Value property ${key} must be a string`,
        400,
        ErrorCodes.BAD_REQUEST
      );
    }
  });
};
