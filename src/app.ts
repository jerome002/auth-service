import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./utils/logger.util.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";

const app = express();

/**
 * Security & Global Middleware
 * Decision: Helmet sets security headers (CSP, XSS, etc.).
 * Decision: JSON limit of 10kb is a Rule 10 'Defense in Depth' move against large payload attacks.
 */
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "10kb" }));

/**
 * Logging Integration
 * Decision: Morgan handles HTTP traffic logs, Winston handles system/error logs.
 * Piping Morgan to Winston ensures all logs are unified and formatted correctly for Production.
 */
app.use(morgan("combined", { 
  stream: { write: (msg) => logger.info(msg.trim()) } 
}));

/**
 * 3. Centralized Route Registration
 * Engineering Decision: Using prefixes allows you to version your API later (e.g., /api/v1).
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

/**
 * Health Check
 * Essential for Orchestration (Docker/K8s) to know if the service needs a restart.
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
});

/**
 * 404 Catch-all
 * Decision: Explicitly handle unknown routes to prevent Express from sending HTML error pages.
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/**
 * Global Error Handler
 * Rule 10: This must be the LAST middleware. It catches everything passed to next(err).
 */
app.use(globalErrorHandler);

export default app;