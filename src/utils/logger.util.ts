import winston from "winston";

/**
 * Decision: Environment-aware logging
 * Production: JSON (Structured)
 * Development: Colorized Simple Text
 */
const level = process.env.NODE_ENV === "production" ? "info" : "debug";

const formats = [
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), // Rule 10: Always log stack traces
];

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(...formats, winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production" 
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
    }),
  ],
});