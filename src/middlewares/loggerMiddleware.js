import logger from "../config/logger.js";

export const actionLogger = (req, res, next) => {
  logger.info("Action Request Details", {
    ...req
  });
  next();
};
