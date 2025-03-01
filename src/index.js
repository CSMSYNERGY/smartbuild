import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import logger from "./config/logger.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import { wrapAsync } from "./utils/globalUtils.js";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wrap all routes with async handling
app.use("/", wrapAsync(routes));
app.use(errorHandler);

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
