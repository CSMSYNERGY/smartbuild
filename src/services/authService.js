import axios from "axios";
import logger from "../config/logger.js";
import { isTokenExpired } from "../utils/authUtils.js";
import {
  deleteLocationData,
  getLocationData,
  saveLocationData,
} from "./firestoreService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { Timestamp } from "@google-cloud/firestore";

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

    const { access_token, refresh_token, expires_in, scope, userId, planId } =
      response.data;

    const expirationDate = new Date(Date.now() + expires_in * 1000);

    return {
      userId: userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expires: Timestamp.fromDate(expirationDate),
      scopes: scope,
      planId: planId,
    };
  } catch (error) {
    logger.error("Error refreshing access token", error.response?.data);
    throw new AppError(
      "Error authorizing your location. Please re-initiate location authorization from app configuration tab.",
      401,
      ErrorCodes.UNAUTHORIZED
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
      const { planId, ...newAuthData } = await getAccessTokenFromRefreshToken(
        locationData.refreshToken
      );
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

export const retryLocationAuthorization = async (locationId) => {
  const body = {
    locationId: locationId,
    clientKey: process.env.GHL_CLIENT_ID,
    clientSecret: process.env.GHL_CLIENT_SECRET,
  };

  try {
    const response = await axios.post(
      `${process.env.GHL_BASE_URL}/oauth/reconnect`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status !== 200) {
      throw new Error(
        `Retry location authorization failed with status ${response.status}`
      );
    }

    const { authorizationCode } = response.data;
    if (!authorizationCode) {
      throw new Error("No authorizationCode received from reconnect endpoint");
    }

    // Get full auth data and save it
    const authData = await getAccessTokenFromAuthCode(authorizationCode);
    const { locationId: returnedLocationId, ...locationData } = authData;

    // Verify the locationId matches what we expect
    if (returnedLocationId !== locationId) {
      logger.warn(
        `Location ID mismatch during retry: expected ${locationId}, got ${returnedLocationId}`
      );
    }

    await saveLocationData(locationId, locationData);
    return locationData;
  } catch (error) {
    logger.error(
      `Error retrying location authorization for ${locationId}:`,
      error.response?.data || error.message
    );
    throw error instanceof AppError
      ? error
      : new AppError(
          `Error retrying location authorization: ${error.message}`,
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const checkLocationAuthorization = async (locationId) => {
  const locationData = await getAuthenticatedLocation(locationId);
  return locationData ? true : false;
};
