// webAuthMiddleware.js
import jwt from "jsonwebtoken";

const BEARER_PREFIX = "Bearer ";

/**
 * Middleware for UI/Web API routes.
 *
 * - Reads HS256 JWT from Authorization: Bearer <token> header.
 * - Verifies signature with APP_JWT_SECRET.
 * - On success: attaches auth payload to req.webUser and calls next().
 * - On failure: returns 401 (does NOT throw).
 *
 * Requirements:
 * - APP_JWT_SECRET set in environment (.env / runtime).
 */
export function requireWebSession(req, res, next) {
  if (process.env.NODE_ENV === "development") {
    req.webUser = {
      id: "g0KMCSyiM9dxTYz2R5SZ",
      email: "dev@vizio.ai",
      companyId: "cal2iirJyFwWrTrtLXeW",
      locationId: "9cxpdkrVWBUbPT3jtAYk",
      userName: "Vizio Dev Team",
      role: "admin",
      type: "agency",
    };
    return next();
  }

  try {
    const secret = process.env.APP_JWT_SECRET;
    if (!secret) {
      console.error("[requireWebSession] APP_JWT_SECRET missing");
      return res
        .status(500)
        .json({ error: "Server misconfiguration: missing APP_JWT_SECRET" });
    }

    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.webUser = {
      id: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      locationId: payload.locationId,
      userName: payload.userName,
      role: payload.role,
      type: payload.type,
    };

    return next();
  } catch (err) {
    console.error("[requireWebSession] Unexpected error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
