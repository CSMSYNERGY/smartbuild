import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import logger from "./config/logger.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import { wrapAsync } from "./utils/globalUtils.js";

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

// Wrap all routes with async handling
app.use("/", wrapAsync(routes));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
