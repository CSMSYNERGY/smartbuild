import axios from "axios";
import logger from "../config/logger.js";
import { isTokenExpired } from "../utils/authUtils.js";
import {
  getLocationData,
  getSmartbuildAuthData,
  saveLocationData,
  saveSmartbuildAuthData,
} from "./firestoreService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { Timestamp } from "@google-cloud/firestore";
import {
  getSmartbuildToken,
  getSmartbuildTokenFromRefreshToken,
} from "./smartbuildService.js";

export const authenticateAndSaveUser = async (code) => {
  try {
    const authData = await getAccessTokenFromAuthCode(code);
    const { locationId, ...locationData } = authData;
    await saveLocationData(locationId, locationData);
    return { locationId: locationId, accessToken: authData.accessToken };
  } catch (error) {
    throw new AppError(
      "Error authenticating and saving user.",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAccessTokenFromAuthCode = async (code) => {
  try {
    const formData = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
    });

    const response = await axios.post(
      `${process.env.GHL_BASE_URL}/oauth/token`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      userId,
      locationId,
    } = response.data;

    const expirationDate = new Date(Date.now() + expires_in * 1000);

    return {
      userId: userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expires: Timestamp.fromDate(expirationDate),
      locationId: locationId,
      scopes: scope,
    };
  } catch (error) {
    throw new AppError(
      "Error getting access token from auth code.",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAccessTokenFromRefreshToken = async (refreshToken) => {
  try {
    const formData = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      refresh_token: refreshToken,
      redirect_uri: process.env.REDIRECT_URI,
      user_type: "Location",
    });

    const response = await axios.post(
      `${process.env.GHL_BASE_URL}/oauth/token`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in, scope, userId } =
      response.data;

    const expirationDate = new Date(Date.now() + expires_in * 1000);

    return {
      userId: userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expires: Timestamp.fromDate(expirationDate),
      scopes: scope,
    };
  } catch (error) {
    logger.error("Error refreshing access token", error.response?.data);
    throw new AppError(
      "Error refreshing access token.",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAuthenticatedLocation = async (locationId) => {
  try {
    const locationData = await getLocationData(locationId);
    if (!locationData) {
      throw new AppError(
        `Location ${locationId} not found`,
        404,
        ErrorCodes.LOCATION_NOT_FOUND
      );
    }

    if (isTokenExpired(locationData.expires)) {
      logger.info(
        `Access token expired for location ${locationId}. Refreshing...`
      );

      // Get new access token
      const newAuthData = await getAccessTokenFromRefreshToken(
        locationData.refreshToken
      );

      // Save updated authentication data
      await saveLocationData(locationId, newAuthData);

      return newAuthData;
    }

    // Return existing auth data if not expired
    return locationData;
  } catch (error) {
    throw error instanceof AppError
      ? error
      : new AppError(
          `Error getting authenticated location: ${error.message}`,
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const authenticateSmartbuild = async (
  locationId,
  smartbuildUserId,
  smartbuildUserPassword
) => {
  try {
    const smartbuildAuthData = await getSmartbuildToken(
      smartbuildUserId,
      smartbuildUserPassword
    );
    await saveSmartbuildAuthData(locationId, {
      ...smartbuildAuthData,
      smartbuildUserId: smartbuildUserId,
    });
  } catch (error) {
    throw error instanceof AppError
      ? error
      : new AppError(
          `Error getting authenticating smartbuild for location: ${error.message}`,
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const getAuthenticatedSmartbuild = async (locationId) => {
  try {
    const smartbuildAuthData = await getSmartbuildAuthData(locationId);
    if (!smartbuildAuthData) {
      throw new AppError(
        `Smartbuild auth data not found for location ${locationId}`,
        404,
        ErrorCodes.SMARTBUILD_AUTH_DATA_NOT_FOUND
      );
    }
    if (isTokenExpired(smartbuildAuthData.expires)) {
      logger.info(
        `Smartbuild token expired for location ${locationId}. Refreshing...`
      );
      const newSmartbuildAuthData = await getSmartbuildTokenFromRefreshToken(
        smartbuildAuthData.refreshToken
      );
      await saveSmartbuildAuthData(locationId, newSmartbuildAuthData);
      return newSmartbuildAuthData;
    }
    return smartbuildAuthData;
  } catch (error) {
    throw error instanceof AppError
      ? error
      : new AppError(
          `Error getting authenticated smartbuild for location: ${error.message}`,
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
  }
};
