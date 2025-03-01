import logger from "../config/logger.js";

export const actionLogger = (req, res, next) => {
  logger.info("Action Request Details", {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    body: JSON.stringify(req.body),
    headers: JSON.stringify(req.headers),
    ip: req.ip
  });
  next();
};
