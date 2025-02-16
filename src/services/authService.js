import logger from "../config/logger.js";
import { getAccountType, isTokenExpired } from "../utils/authUtils.js";
import { getUserAuthData, saveUserAuthData } from "./firestoreService.js";

export const authenticateAndSaveUser = async (code) => {
  const authData = await getAccessTokenFromAuthCode(code);
  await saveUserAuthData(authData.userId, authData);
};

export const getAccessTokenFromAuthCode = async (code) => {
  try {
    const response = await axios.post(
      "https://marketplace.gohighlevel.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }
    );

    if (response.status !== 200) {
      throw Error(
        `Access token retrieval failed with status ${response.status}`
      );
    }
    const accountType = getAccountType(response.data);
    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      approvedLocations,
      userId,
    } = response.data;

    return {
      userId: userId,
      accountType: accountType,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scopes: scope,
      locationsAvailable: approvedLocations,
      created: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    throw error;
  }
};

export const getAccessTokenFromRefreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      "https://marketplace.gohighlevel.com/oauth/token",
      {
        grant_type: "refresh_token",
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        refresh_token: refreshToken,
        redirect_uri: process.env.REDIRECT_URI,
      }
    );

    if (response.status !== 200) {
      throw new Error(`Token refresh failed with status ${response.status}`);
    }
    const accountType = getAccountType(response.data);

    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      approvedLocations,
      userId,
    } = response.data;

    // Return the new access token data
    return {
      userId: userId,
      accessToken: access_token,
      accountType: accountType,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scopes: scope,
      locationsAvailable: approvedLocations,
      created: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    logger.error("Error refreshing access token", error);
    throw error;
  }
};

export const getAuthenticatedUser = async (userId) => {
  try {
    const authData = await getUserAuthData(userId);

    if (!authData) {
      throw new Error("User authentication data not found.");
    }

    if (isTokenExpired(authData.created, authData.expiresIn)) {
      logger.info(`Access token expired for user ${userId}. Refreshing...`);

      // Get new access token
      const newAuthData = await getAccessTokenFromRefreshToken(
        authData.refreshToken
      );

      // Save updated authentication data
      await saveUserAuthData(newAuthData.userId, newAuthData);

      return newAuthData;
    }

    // Return existing auth data if not expired
    return authData;
  } catch (error) {
    logger.error("Error retrieving authenticated user:", error.message);
    throw error;
  }
};
