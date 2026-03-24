import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser"; // Added
import rateLimit from "express-rate-limit"; // Added
import { logger } from "./utils/logger.util.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";

const app = express();

/**
 * Rate Limiting (Production-Grade Security)
 * Decision: Prevent brute-force attacks on sensitive auth endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});

/**
 * Security & Global Middleware
 */
app.use(helmet());

// Decision: Update CORS to allow credentials (cookies)
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || "*", 
  credentials: true 
}));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser()); // Required to read HttpOnly cookies

/**
 * Logging Integration
 */
app.use(morgan("combined", { 
  stream: { write: (msg) => logger.info(msg.trim()) } 
}));

/**
 * Route Registration
 * Decision: Apply the rate limiter specifically to auth routes.
 */
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);

/**
 * Health Check
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
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/**
 * Global Error Handler
 */
app.use(globalErrorHandler);

export default app;