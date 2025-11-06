import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";

export const decryptUserData = (encryptedData) => {
  const SHARED_SECRET = process.env.GHL_SHARED_SECRET;
  // Follow the exact algorithm from GHL "User Context" docs.
  const decrypted = CryptoJS.AES.decrypt(encryptedData, SHARED_SECRET).toString(
    CryptoJS.enc.Utf8
  );

  if (!decrypted) throw new Error("Decryption failed");
  return JSON.parse(decrypted);
};

export const setSessionCookie = (res, claims) => {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) {
    console.error("[setSessionCookie] APP_JWT_SECRET missing");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing APP_JWT_SECRET" });
  }

  const token = jwt.sign(claims, secret, {
    algorithm: "HS256",
    expiresIn: "60m",
  });

  res.cookie("SESSION", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 20 * 60 * 1000,
  });
};

export const decryptAndSetSessionCookie = (req, res) => {
  try {
    const { encryptedData } = req.body;
    if (!encryptedData) {
      return res.status(400).json({ error: "Missing encryptedData" });
    }

    const user = decryptUserData(encryptedData);
    // user: { userId, companyId, activeLocation, email, role, ... }

    if(!user.activeLocation) {
      return res.status(400).json({ error: "No sub-account identity found. Use Sub-Account view in order to proceed.", claims: {...claims}, user: {...user} });
    }
    // decide entitlements here later (free/pro)
    const claims = {
      sub: user.userId,
      companyId: user.companyId,
      email: user.email,
      userName: user.userName,
      locationId: user.activeLocation,
      role: user.role,
      type: user.type,
    };

    const isValid = Object.keys(claims).every((key) => claims[key] != null);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid authenticity. Please contact support.", claims: {...claims}, user: {...user} });
    }

    setSessionCookie(res, claims);

    // Frontend gets non-sensitive info only; auth is via cookie
    res.json(claims);
  } catch (err) {
    console.error("SSO decrypt failed", err);
    res.status(400).json({ error: "Invalid or undecryptable payload" });
  }
};
