import db from "../config/firestoreConfig.js";
import { AppError } from "../models/errors.js";

export const saveSmartbuildAuthData = async (locationId, authData) => {
  try {
    await db
      .collection("smartbuild")
      .doc(locationId)
      .set(authData, { merge: true });
  } catch (error) {
    throw new AppError(
      "Database save failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getSmartbuildAuthData = async (locationId) => {
  try {
    const doc = await db.collection("smartbuild").doc(locationId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    throw new AppError(
      "Database read failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const saveLocationData = async (locationId, locationData) => {
  try {
    await db
      .collection("locations")
      .doc(locationId)
      .set(locationData, { merge: true });
  } catch (error) {
    throw new AppError(
      "Database save failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getLocationData = async (locationId) => {
  try {
    const doc = await db.collection("locations").doc(locationId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    throw new AppError(
      "Database read failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};