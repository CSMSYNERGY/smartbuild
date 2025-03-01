import logger from "../config/logger.js";

export const actionLogger = (req, res, next) => {
  logger.info("Action Request Details", {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
};
