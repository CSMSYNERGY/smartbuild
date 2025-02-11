import db from "../config/firestoreConfig.js";

export const saveUserAuthData = async (ghlAccountId, authData) => {
  try {
    await db.collection("ghl_users").doc(ghlAccountId).set(authData, { merge: true });
    console.log("User auth data saved successfully.");
  } catch (error) {
    console.error("Error saving user auth data:", error);
    throw new Error("Database save failed.");
  }
};

export const getUserAuthData = async (ghlAccountId) => {
  try {
    const doc = await db.collection("ghl_users").doc(ghlAccountId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (error) {
    console.error("Error retrieving user auth data:", error);
    throw new Error("Database read failed.");
  }
};
