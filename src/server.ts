import app from "./app.js";
import { logger } from "./utils/logger.util.js";

const PORT = process.env.PORT || 3000;

/**
 * Decision: Separate the listen call.
 * This allows Supertest to import 'app' and run tests without binding to a port.
 */
const server = app.listen(PORT, () => {
  logger.info(`Auth Service (RS256) running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

/**
 * Decision: Graceful Shutdown (Rule 10)
 * If the process receives a termination signal, close DB connections first.
 */
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received. Closing HTTP server...");
  server.close(() => {
    logger.info("HTTP server closed.");
  });
});