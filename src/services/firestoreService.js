import db from "../config/firestoreConfig.js";
import logger from "../config/logger.js";
import { AppError } from "../models/errors.js";

export const saveCompanyAuthData = async (companyId, authData) => {
  try {
    await db
      .collection("companies")
      .doc(companyId)
      .set(authData, { merge: true });
  } catch (error) {
    logger.error("Error saving company auth data:", error);
    throw new AppError("Database save failed.", 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
};

export const getCompanyAuthData = async (companyId) => {
  try {
    const doc = await db.collection("companies").doc(companyId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    logger.error("Error retrieving company auth data:", error);
    throw new AppError("Database read failed.", 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
};

export const updateCompanyAuthData = async (companyId, authData) => {
  try {
    await db.collection("companies").doc(companyId).update(authData);
  } catch (error) {
    logger.error("Error updating company auth data:", error);
    throw new AppError("Database update failed.", 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
};

export const saveLocationData = async (locationId, locationData) => {
  try {
    await db
      .collection("locations")
      .doc(locationId)
      .set(locationData, { merge: true });
  } catch (error) {
    throw new AppError("Database save failed.", 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
};

export const getLocationData = async (locationId) => {
  try {
    const doc = await db.collection("locations").doc(locationId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    throw new AppError("Database read failed.", 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
};

export const findCompanyByLocation = async (locationId) => {
  try {
    const companySnapshot = await db
      .collection("companies")
      .where("locationsAvailable", "array-contains", locationId)
      .limit(1)
      .get();
    
    if (companySnapshot.empty) return null;
    return {
      ...companySnapshot.docs[0].data()
    };
  } catch (error) {
    throw new AppError("Error finding company by location.", 500, ErrorCodes.INTERNAL_SERVER_ERROR);
  }
};