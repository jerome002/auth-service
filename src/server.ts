// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import winston from "winston";

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { authenticate } from "./middlewares/auth.middleware.js";

const app = express();

// Security & JSON
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

// Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// HTTP logging via Morgan + Winston
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Routes
app.use("/auth", authRoutes);
app.use("/users", authenticate, userRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`));

export default app;