import db from "../config/firestoreConfig.js";
import logger from "../config/logger.js";

export const saveCompanyAuthData = async (companyId, authData) => {
  try {
    await db
      .collection("companies")
      .doc(companyId)
      .set(authData, { merge: true });
  } catch (error) {
    logger.error("Error saving company auth data:", error);
    throw new Error("Database save failed.");
  }
};

export const getCompanyAuthData = async (companyId) => {
  try {
    const doc = await db.collection("companies").doc(companyId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    logger.error("Error retrieving company auth data:", error);
    throw new Error("Database read failed.");
  }
};

export const updateCompanyAuthData = async (companyId, authData) => {
  try {
    await db.collection("companies").doc(companyId).update(authData);
  } catch (error) {
    logger.error("Error updating company auth data:", error);
    throw new Error("Database update failed.");
  }
};

export const saveLocationData = async (locationId, locationData) => {
  try {
    await db
      .collection("locations")
      .doc(locationId)
      .set(locationData, { merge: true });
  } catch (error) {
    logger.error("Error saving location data:", error);
    throw new Error("Database save failed.");
  }
};

export const getLocationData = async (locationId) => {
  try {
    const doc = await db.collection("locations").doc(locationId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    logger.error("Error retrieving location data:", error);
    throw new Error("Database read failed.");
  }
};

