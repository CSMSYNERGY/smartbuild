import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = "60m";

export const decryptUserData = (encryptedData) => {
  const SHARED_SECRET = process.env.GHL_SHARED_SECRET;
  const decrypted = CryptoJS.AES.decrypt(encryptedData, SHARED_SECRET).toString(
    CryptoJS.enc.Utf8
  );

  if (!decrypted) throw new Error("Decryption failed");
  return JSON.parse(decrypted);
};

/**
 * Create a JWT from claims (no refresh token). Used for CPI plugin auth.
 */
export const createAuthToken = (claims) => {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) {
    throw new Error("APP_JWT_SECRET is not set");
  }
  return jwt.sign(claims, secret, {
    algorithm: "HS256",
    expiresIn: TOKEN_EXPIRY,
  });
};

/**
 * Decrypt encryptedData, validate, create JWT and return token + claims.
 * No session cookie; frontend stores JWT in sessionStorage (key: CPI_PLUGIN_TOKEN_<locationId>).
 */
export const decryptAndSetSessionCookie = (req, res) => {
  try {
    const { encryptedData } = req.body;
    if (!encryptedData) {
      return res.status(400).json({ error: "Missing encryptedData" });
    }

    const user = decryptUserData(encryptedData);

    if (!user.activeLocation) {
      return res.status(400).json({
        error:
          "No sub-account identity found. Use Sub-Account view in order to proceed.",
        user: { ...user },
      });
    }

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
      return res.status(400).json({
        error: "Invalid authenticity. Please contact support.",
        claims: { ...claims },
        user: { ...user },
      });
    }

    const token = createAuthToken(claims);

    // Return JWT and claims; frontend stores token in sessionStorage (CPI_PLUGIN_TOKEN_<locationId>)
    res.json({ token, ...claims });
  } catch (err) {
    console.error("SSO decrypt failed", err);
    res.status(400).json({ error: "Invalid or undecryptable payload" });
  }
};
