import {
  authenticateAndSaveUser,
  authenticateSmartbuild,
  getAuthenticatedLocation,
} from "../services/authService.js";
import crypto from "crypto";

export const authorize = (req, res) => {
  const ghlAuthUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&client_id=${process.env.GHL_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=${process.env.GHL_SCOPES}`;
  res.redirect(ghlAuthUrl);
};

export const callback = async (req, res) => {
  const { code } = req.query;
  if (!code)
    return res.status(400).json({ error: "No authorization code provided" });

  const { locationId, accessToken } = await authenticateAndSaveUser(code);
  res.render("smartbuild-login", {
    locationId: locationId,
    accessToken: accessToken,
  });
};

export const authenticateSmartbuildPost = async (req, res) => {
  const { smartbuildUserId, smartbuildUserPassword, accessToken, locationId } =
    req.body;
  await checkAccessToken(accessToken, locationId);
  await authenticateSmartbuild(
    locationId,
    smartbuildUserId,
    smartbuildUserPassword
  );
  res.status(200).json({
    redirect: "/auth/success",
  });
};

const checkAccessToken = async (accessToken, locationId) => {
  if (!accessToken || !locationId) {
    throw new AppError(
      "Missing access token or location ID",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const locationAuthData = await getAuthenticatedLocation(locationId);

  if (!locationAuthData?.accessToken) {
    throw new AppError(
      "Location not found or unauthorized",
      404,
      ErrorCodes.NOT_FOUND
    );
  }
  const isValid = crypto.timingSafeEqual(
    Buffer.from(locationAuthData.accessToken),
    Buffer.from(accessToken)
  );

  if (!isValid) {
    throw new AppError("Invalid access token", 401, ErrorCodes.UNAUTHORIZED);
  }
};

export const success = (req, res) => {
  res.render("success");
};
