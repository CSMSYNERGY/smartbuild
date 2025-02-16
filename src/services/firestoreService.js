import db from "../config/firestoreConfig.js";
import logger from "../config/logger.js";

export const saveUserAuthData = async (userID, authData) => {
  try {
    await db
      .collection("ghl_users")
      .doc(userID)
      .set(authData, { merge: true });
  } catch (error) {
    logger.error("Error saving user auth data:", error);
    throw new Error("Database save failed.");
  }
};

export const getUserAuthData = async (userID) => {
  try {
    const doc = await db.collection("ghl_users").doc(userID).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    logger.error("Error retrieving user auth data:", error);
    throw new Error("Database read failed.");
  }
};

export const updateUserAuthData = async (userID, authData) => {
  try {
    await db.collection("ghl_users").doc(userID).update(authData);
  } catch (error) {
    logger.error("Error updating user auth data:", error);
    throw new Error("Database update failed.");
  }
};
