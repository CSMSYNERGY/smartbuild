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

/**
 * Logs response data for action endpoints. Wraps res.json and res.send
 * so the outgoing body is logged before being sent.
 */
export const actionResponseLogger = (req, res, next) => {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body) {
    try {
      logger.info("Action Response", {
        path: req.path,
        statusCode: res.statusCode,
        body,
      });
    } catch (_) {
      /* never let logging prevent the response */
    }
    return originalJson(body);
  };

  res.send = function (body) {
    try {
      logger.info("Action Response", {
        path: req.path,
        statusCode: res.statusCode,
        body,
      });
    } catch (_) {
      /* never let logging prevent the response */
    }
    return originalSend(body);
  };

  next();
};
