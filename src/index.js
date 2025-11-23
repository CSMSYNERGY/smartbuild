//express index.js
import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import logger from "./config/logger.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import { wrapAsync } from "./utils/globalUtils.js";
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import { initializeFirestore } from "./config/firestoreConfig.js";

// Load environment variables first
dotenv.config();

// Initialize Firestore after environment variables are loaded
initializeFirestore();

const app = express();
app.use(express.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wrap all routes with async handling
app.use("/", wrapAsync(routes));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ----- NEW: serve React app at /app -----
const uiDir = path.join(__dirname, "../frontend/dist");

// static assets (JS/CSS) live here
app.use("/app", express.static(uiDir, { index: false, maxAge: "1h" }));

// history-fallback so client-side routes work
app.get("/app/*", (_req, res) => {
  res.sendFile(path.join(uiDir, "index.html"));
});

app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
