// firestoreService.js
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

export const getSubscription = async (subscriptionId) => {
  try {
    const doc = await db.collection("subscriptions").doc(subscriptionId).get();
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

export const getEntitlement = async (locationId) => {
  try {
    const doc = await db.collection("entitlements").doc(locationId).get();
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

//cant we make these return the existing value ?
export const saveEntitlement = async (locationId, entitlement) => {
  try {
    await db
      .collection("entitlements")
      .doc(locationId)
      .set(entitlement, { merge: true });
  } catch (error) {
    throw new AppError(
      "Database save failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const saveSubscription = async (subscriptionId, subscription) => {
  try {
    await db
      .collection("subscriptions")
      .doc(subscriptionId)
      .set(subscription, { merge: true });
  } catch (error) {
    throw new AppError(
      "Database save failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteEntitlement = async (locationId) => {
  try {
    await db.collection("entitlements").doc(locationId).delete();
  } catch (error) {
    throw new AppError(
      "Database delete failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteSubscription = async (subscriptionId) => {
  try {
    await db.collection("subscriptions").doc(subscriptionId).delete();
  } catch (error) {
    throw new AppError(
      "Database delete failed: " + error.message,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};
