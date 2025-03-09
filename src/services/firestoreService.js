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

export const deleteSmartbuildAuthData = async (locationId) => {
  try {
    await db.collection("smartbuild").doc(locationId).delete();
  } catch (error) {
    throw new AppError(
      "Database delete failed: " + error.message,
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

export const deleteLocationData = async (locationId) => {
  try {
    await db.collection("locations").doc(locationId).delete();
  } catch (error) {
    throw new AppError(
      "Database delete failed: " + error.message,
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

export const checkSubscription = async (planId, locationId) => {
  try {
    const plansRef = db.collection("plans");
    const docsToGet = [plansRef.doc(locationId)];

    if (planId) {
      docsToGet.push(plansRef.doc(planId));
    }

    const docs = await db.getAll(...docsToGet);
    return docs.some((doc) => doc.exists);
  } catch (error) {
    throw new AppError(
      "Subscription check failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};
