import axios from "axios";
import logger from "../config/logger.js";
import { getAccountType, isTokenExpired } from "../utils/authUtils.js";
import { getCompanyAuthData, saveCompanyAuthData } from "./firestoreService.js";
import { getLocationData, saveLocationData } from "./firestoreService.js";

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
        validateStatus: false, // Don't throw on non-2xx status
      }
    );
    if (response.status !== 200) {
      logger.error("GHL OAuth error:", {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
      throw new Error(
        `Access token retrieval failed with status ${
          response.status
        }: ${JSON.stringify(response.data)}`
      );
    }
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
    logger.error("Error getting access token from auth code:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
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

    if (response.status !== 200) {
      throw new Error(`Token refresh failed with status ${response.status}`);
    }

    const { access_token, refresh_token, expires_in, scope, userId } =
      response.data;
    // Return the new access token data
    return {
      userId: userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scopes: scope,
      created: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    logger.error("Error refreshing access token", error);
    throw error;
  }
};

export const getAuthenticatedCompany = async (companyId) => {
  try {
    const authData = await getCompanyAuthData(companyId);

    if (!authData) {
      throw new Error("Company authentication data not found.");
    }

    if (isTokenExpired(authData.created, authData.expiresIn)) {
      logger.info(
        `Access token expired for company ${companyId}. Refreshing...`
      );

      // Get new access token
      const newAuthData = await getAccessTokenFromRefreshToken(
        authData.refreshToken,
        "Company"
      );

      // Save updated authentication data
      await saveCompanyAuthData(newAuthData.companyId, newAuthData);

      return newAuthData;
    }

    // Return existing auth data if not expired
    return authData;
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
        },
        validateStatus: false, // Don't throw on non-2xx status
      }
    );

    if (response.status !== 200) {
      logger.error("GHL Location Token error:", {
        status: response.status,
        data: response.data,
      });
      throw new Error(
        `Location token retrieval failed with status ${response.status}`
      );
    }

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
      throw new Error("Location authentication data not found.");
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
  try {
    // First try to find the location document
    const locationData = await getLocationData(locationId);
    if (locationData) {
      return locationData;
    }

    // If location not found, search in company users
    const companySnapshot = await db
      .collection("companies")
      .where("locationsAvailable", "array-contains", locationId)
      .limit(1)
      .get();

    if (companySnapshot.empty) {
      return null;
    }

    const companyDoc = companySnapshot.docs[0];
    const companyData = companyDoc.data();

    const locationToken = await getLocationAccessTokenFromCompanyToken(
      companyData.accessToken,
      companyData.companyId,
      locationId
    );

    // Store the location token using the service function
    const locationDataToStore = {
      ...locationToken,
      created: Math.floor(Date.now() / 1000),
      companyId: companyData.companyId,
    };

    await saveLocationData(locationId, locationDataToStore);
    return locationDataToStore;
  } catch (error) {
    logger.error("Error in findAndStoreLocationToken:", {
      locationId,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
