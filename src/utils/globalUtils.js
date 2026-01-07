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