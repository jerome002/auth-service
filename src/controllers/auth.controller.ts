import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";
import { loginSchema } from "../schemas/auth.schema.js";
import { 
  loginUser, 
  logoutUser, 
  verifyEmail, 
  refreshTokens, 
  AuthenticationError 
} from "../services/auth.service.js";

/**
 * Handles User Login
 * POST /api/auth/login
 */
export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const identifier = input.email ?? input.username;

    if (!identifier) {
      return res.status(400).json({ success: false, message: "Email or username is required" });
    }

    const data = await loginUser({ identifier, password: input.password });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });

  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues.map((e: ZodIssue) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }

    if (err instanceof AuthenticationError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    console.error("[LoginController Error]:", err);
    return res.status(500).json({ success: false, message: "An internal server error occurred" });
  }
}

/**
 * Handles Email Verification from Link
 * GET /api/auth/verify-email?token=...
 */
export async function verifyEmailController(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is missing" });
    }

    await verifyEmail(String(token));

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid or expired token"
    });
  }
}

/**
 * Handles Token Refresh (Rotation)
 * POST /api/auth/refresh
 */
export async function refreshController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }

    const data = await refreshTokens(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data,
    });
  } catch (err: any) {
    const status = err instanceof AuthenticationError ? err.statusCode : 401;
    return res.status(status).json({
      success: false,
      message: err.message || "Session expired"
    });
  }
}

/**
 * Handles User Logout (Session Invalidation)
 * POST /api/auth/logout
 */
export async function logoutController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }

    await logoutUser(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully. Session invalidated.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error during logout" });
  }
}