//webAuthMiddleware.js

import jwt from "jsonwebtoken";

/**
 * Middleware for UI/Web API routes.
 *
 * - Reads HS256 JWT from SESSION cookie.
 * - Verifies signature with APP_JWT_SECRET.
 * - On success: attaches auth payload to req.webUser and calls next().
 * - On failure: returns 401 (does NOT throw).
 *
 * Requirements:
 * - cookie-parser registered before this middleware.
 * - APP_JWT_SECRET set in environment (.env / runtime).
 */
export function requireWebSession(req, res, next) {
  try {
    const secret = process.env.APP_JWT_SECRET;
    if (!secret) {
      console.error("[requireWebSession] APP_JWT_SECRET missing");
      return res
        .status(500)
        .json({ error: "Server misconfiguration: missing APP_JWT_SECRET" });
    }

    const token = req.cookies?.SESSION;
    if (!token) {
      return res.status(401).json({ error: "Missing session" });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Attach a normalized user object for downstream handlers
    // Adjust fields to your signing payload shape.
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
