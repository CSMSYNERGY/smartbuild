import { Firestore } from "@google-cloud/firestore";

let db = null;

/**
 * Initialize Firestore with the appropriate configuration based on environment.
 * Should be called after dotenv.config() in the application entry point.
 */
export function initializeFirestore() {
  if (db !== null) {
    // Already initialized
    return db;
  }

  if (process.env.NODE_ENV === "development") {
    // Development: Use custom service account key file
    const config = {
      projectId: process.env.GCP_PROJECT_ID,
    };

    // Use key file if provided via environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Alternative: direct path to service account key
      config.keyFilename = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    }

    db = new Firestore(config);
  } else {
    // Production: Automatically uses Google Cloud IAM credentials
    const config = {};
    
    // Still set project ID if provided
    if (process.env.GCP_PROJECT_ID) {
      config.projectId = process.env.GCP_PROJECT_ID;
      db = new Firestore(config);
    } else {
      db = new Firestore();
    }
  }

  return db;
}

/**
 * Get the Firestore instance.
 * Throws an error if Firestore hasn't been initialized yet.
 */
function getDb() {
  if (db === null) {
    throw new Error(
      "Firestore not initialized. Call initializeFirestore() in your application entry point."
    );
  }
  return db;
}

// Export a Proxy that forwards all property access to the initialized db instance
// This ensures the db is initialized before any methods are called
export default new Proxy({}, {
  get(target, prop) {
    return getDb()[prop];
  },
  set(target, prop, value) {
    getDb()[prop] = value;
    return true;
  }
});
