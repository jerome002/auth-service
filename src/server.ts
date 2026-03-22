import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import winston from "winston";

// Import Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

/**
 * 1. Logger Configuration (Winston)
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

/**
 * 2. Security & Global Middleware
 */
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" })); // Restrict this in production
app.use(express.json({ limit: "10kb" })); // Body parser with payload limit to prevent DoS

// HTTP request logging via Morgan hooked into Winston
app.use(morgan("combined", { 
  stream: { write: (msg) => logger.info(msg.trim()) } 
}));

/**
 * 3. Route Registration
 */
app.use("/api/auth", authRoutes); // Public & Auth-related (Login, Register, Verify)
app.use("/api/users", userRoutes); // Protected Profile & Admin management

/**
 * 4. Health Check
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
});

/**
 * 5. 404 Catch-all
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/**
 * 6. Global Error Handler
 * This prevents the app from crashing and hides internal stack traces from users.
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[Global Error]: ${err.stack || err.message}`);
  
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === "production" 
      ? "An internal server error occurred" 
      : err.message,
  });
});

/**
 * 7. Server Initialization
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;