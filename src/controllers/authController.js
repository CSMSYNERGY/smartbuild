import { authenticateAndSaveUser } from "../services/authService.js";
import logger from "../config/logger.js";

export const authorize = (req, res) => {
  const ghlAuthUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&client_id=${process.env.GHL_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=${process.env.GHL_SCOPES}`;
  res.redirect(ghlAuthUrl);
};

export const callback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`/app/public?type=location_auth_error`);

  const { locationId, accessToken } = await authenticateAndSaveUser(code);
  logger.info(`Location ${locationId} authenticated and saved`);
  res.redirect(`/app/public?type=location_auth_success`);
};
