import { Request, Response } from "express";
import { loginSchema } from "../schemas/auth.schema.js";
import * as AuthService from "../services/auth.service.js";
import { sendResponse } from "../utils/response.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";

/**
 * Helper: Extract metadata from request
 * Uses .toString() to ensure we pass a string, even if headers are an array
 */
const getMetadata = (req: Request) => ({
  ip: (req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown'),
  ua: req.headers['user-agent']?.toString() || 'unknown'
});

/**
 * Handles User Login
 * POST /api/auth/login
 */
export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const identifier = (input.email ?? input.username) as string;
  const metadata = getMetadata(req);

  const data = await AuthService.loginUser({ 
    identifier, 
    password: input.password,
    metadata 
  });

  // Set Refresh Token in a secure HttpOnly cookie
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendResponse({
    res,
    message: "Login successful",
    data: {
      user: data.user,
      accessToken: data.accessToken,
    },
  });
});

/**
 * Handles Email Verification
 * GET /api/auth/verify-email?token=...
 */
export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    return sendResponse({ res, status: 400, message: "Verification token is required" });
  }

  await AuthService.verifyEmail(token);
  return sendResponse({ res, message: "Email verified successfully." });
});

/**
 * Handles Token Refresh (Rotation)
 * Decision: Checks cookies first, falls back to body.
 */
export const refreshController = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return sendResponse({ res, status: 401, message: "Refresh token is required" });
  }

  const metadata = getMetadata(req);
  const data = await AuthService.refreshTokens(refreshToken, metadata);

  // Rotate the cookie with the new token
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendResponse({
    res,
    message: "Tokens refreshed successfully",
    data: { accessToken: data.accessToken },
  });
});

/**
 * Handles User Logout
 */
export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    await AuthService.logoutUser(refreshToken);
  }

  // Clear the cookie regardless of whether the token was found
  res.clearCookie("refreshToken");

  return sendResponse({ res, message: "Logged out successfully." });
});

/**
 * GET /api/auth/sessions
 */
export const getSessionsController = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await AuthService.getUserSessions(req.user!.id);
  return sendResponse({ res, message: "Active sessions retrieved", data: sessions });
});

/**
 * DELETE /api/auth/sessions/:id
 */
export const revokeSessionController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await AuthService.revokeSession(req.user!.id, id);
  return sendResponse({ res, message: "Session revoked successfully" });
});