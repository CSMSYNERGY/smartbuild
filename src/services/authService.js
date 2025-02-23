import axios from "axios";
import logger from "../config/logger.js";
import { getAccountType, isTokenExpired } from "../utils/authUtils.js";
import {
  saveCompanyAuthData,
  findCompanyByLocation,
  getLocationData,
  saveLocationData,
} from "./firestoreService.js";
import { AppError, ErrorCodes } from "../models/errors.js";

export const authenticateAndSaveUser = async (code) => {
  const authData = await getAccessTokenFromAuthCode(code);
  if (authData.accountType === "company") {
    const locations = await getCompanyLocations(
      authData.accessToken,
      authData.companyId
    );
    authData.locationsAvailable = locations;
    await saveCompanyAuthData(authData.companyId, authData);
  } else {
    await saveLocationData(authData.locationId, authData);
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

    const accountType = getAccountType(response.data);
    const { access_token, refresh_token, expires_in, scope, userId } =
      response.data;

    const result = {
      userId: userId,
      accountType: accountType,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scopes: scope,
      created: Math.floor(Date.now() / 1000),
    };

    if (accountType === "company") {
      result.companyId = response.data.companyId;
    } else {
      result.locationId = response.data.locationId;
    }

    return result;
  } catch (error) {
    throw new AppError(
      "Error getting access token from auth code.",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAccessTokenFromRefreshToken = async (
  refreshToken,
  userType
) => {
  try {
    const formData = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      refresh_token: refreshToken,
      redirect_uri: process.env.REDIRECT_URI,
      user_type: userType,
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

    const accountType = getAccountType(response.data);
    const { access_token, refresh_token, expires_in, scope, userId } =
      response.data;

    const result = {
      userId: userId,
      accountType: accountType,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scopes: scope,
      created: Math.floor(Date.now() / 1000),
    };

    if (accountType === "company") {
      result.companyId = response.data.companyId;
    } else {
      result.locationId = response.data.locationId;
    }

    return result;
  } catch (error) {
    logger.error("Error refreshing access token", error.response?.data);
    throw new AppError(
      "Error refreshing access token.",
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAuthenticatedCompanyByLocation = async (locationId) => {
  try {
    const companyData = await findCompanyByLocation(locationId);
    if (!companyData) {
      throw new AppError(
        "Company authentication data not found.",
        404,
        ErrorCodes.COMPANY_NOT_FOUND
      );
    }

    if (isTokenExpired(companyData.created, companyData.expiresIn)) {
      logger.info(
        `Access token expired for company ${companyData.companyId}. Refreshing...`
      );

      // Get new access token
      const newAuthData = await getAccessTokenFromRefreshToken(
        companyData.refreshToken,
        "Company"
      );

      // Save updated authentication data
      await saveCompanyAuthData(newAuthData.companyId, newAuthData);

      return newAuthData;
    }

    // Return existing auth data if not expired
    return companyData;
  } catch (error) {
    logger.error("Error retrieving authenticated company:", error.message);
    throw error;
  }
};

export const getCompanyLocations = async (accessToken, companyId) => {
  try {
    const response = await axios.get(
      `${process.env.GHL_BASE_URL}/locations/search`,
      {
        params: {
          companyId: companyId,
          limit: 1000,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: process.env.GHL_DEFAULT_API_VERSION,
        },
      }
    );

    return response.data.locations.map((location) => location.id);
  } catch (error) {
    logger.error(
      "Error fetching locations:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch locations for company.");
  }
};

export const getLocationAccessTokenFromCompanyToken = async (
  companyToken,
  companyId,
  locationId
) => {
  try {
    const formData = new URLSearchParams({
      companyId: companyId,
      locationId: locationId,
    });
    const response = await axios.post(
      `${process.env.GHL_BASE_URL}/oauth/locationToken`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${companyToken}`,
          Version: process.env.GHL_DEFAULT_API_VERSION,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    };
  } catch (error) {
    logger.error("Error getting location access token:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
  }
};

export const getAuthenticatedLocation = async (locationId) => {
  try {
    const locationData = await findAndStoreLocationToken(locationId);
    if (!locationData) {
      throw new AppError(
        `Location ${locationId} not found`,
        404,
        ErrorCodes.LOCATION_NOT_FOUND
      );
    }

    if (isTokenExpired(locationData.created, locationData.expiresIn)) {
      logger.info(
        `Access token expired for location ${locationId}. Refreshing...`
      );

      // Get new access token
      const newAuthData = await getAccessTokenFromRefreshToken(
        locationData.refreshToken,
        "Location"
      );

      // Save updated authentication data
      await saveLocationData(locationId, newAuthData);

      return newAuthData;
    }

    // Return existing auth data if not expired
    return locationData;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Error getting location auth data:", {
      locationId,
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
  }
};

export const findAndStoreLocationToken = async (locationId) => {
  const locationData = await getLocationData(locationId);
  if (locationData) {
    return locationData;
  }

  // If location not found, search in company users
  const companyData = await getAuthenticatedCompanyByLocation(locationId);
  if (!companyData) {
    return null;
  }

  const locationToken = await getLocationAccessTokenFromCompanyToken(
    companyData.accessToken,
    companyData.companyId,
    locationId
  );

  const locationDataToStore = {
    ...locationToken,
    created: Math.floor(Date.now() / 1000),
    companyId: companyData.companyId,
  };

  await saveLocationData(locationId, locationDataToStore);
  return locationDataToStore;
};
