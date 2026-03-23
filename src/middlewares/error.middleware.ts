import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthenticationError } from "../services/auth.service.js";
import { sendResponse } from "../utils/response.util.js";
import { logger } from "../utils/logger.util.js"; // Decision: Use centralized logger

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /**
   * Log the error details
   * Decision: We log at 'error' level for 500s and 'warn' for 400s.
   * We include the stack trace only if it's not a known validation/auth error.
   */
  const isOperationalError = err instanceof ZodError || err instanceof AuthenticationError;

  if (!isOperationalError) {
    logger.error(`[Unhandled Error] ${err.message}`, { 
      stack: err.stack, 
      path: req.path, 
      method: req.method 
    });
  } else {
    logger.warn(`[Operational Error] ${err.message} at ${req.path}`);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return sendResponse({
      res,
      status: 400,
      success: false,
      message: "Validation failed",
      errors: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Handle Custom Authentication Errors
  if (err instanceof AuthenticationError) {
    return sendResponse({
      res,
      status: err.statusCode,
      success: false,
      message: err.message,
    });
  }

  // Unexpected Server Errors 
  return sendResponse({
    res,
    status: err.statusCode || 500,
    success: false,
    message: process.env.NODE_ENV === "production" 
      ? "An internal server error occurred" 
      : err.message,
  });
};