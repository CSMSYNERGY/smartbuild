import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(), // Use JSON format for Cloud Logging
  transports: [
    new winston.transports.Console({ format: winston.format.json() }),
  ],
});

export default logger;
