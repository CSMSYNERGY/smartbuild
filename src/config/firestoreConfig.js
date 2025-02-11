import { Firestore } from "@google-cloud/firestore";

// Automatically uses Google Cloud IAM credentials
const db = new Firestore();

export default db;
