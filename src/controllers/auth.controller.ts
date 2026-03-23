import { Request, Response } from "express";
import { loginSchema } from "../schemas/auth.schema.js";
import * as AuthService from "../services/auth.service.js";
import { sendResponse } from "../utils/response.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";

/**
 * Handles User Login
 * POST /api/auth/login
 */
export const loginController = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validation: Zod handles the 'email OR username' logic via .refine()
  const input = loginSchema.parse(req.body);
  
  // Decision: Cleanly extract whichever identifier was provided
  const identifier = (input.email ?? input.username) as string;

  // 2. Business Logic
  const data = await AuthService.loginUser({ 
    identifier, 
    password: input.password 
  });

  // 3. Response
  return sendResponse({
    res,
    message: "Login successful",
    data,
  });
});

/**
 * Handles Email Verification
 * GET /api/auth/verify-email?token=...
 */
export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    return sendResponse({
      res,
      status: 400,
      message: "Verification token is required",
    });
  }

  await AuthService.verifyEmail(token);

  return sendResponse({
    res,
    message: "Email verified successfully. You can now log in.",
  });
});

/**
 * Handles Token Refresh (Rotation)
 * POST /api/auth/refresh
 */
export const refreshController = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendResponse({
      res,
      status: 400,
      message: "Refresh token is required",
    });
  }

  const data = await AuthService.refreshTokens(refreshToken);

  return sendResponse({
    res,
    message: "Tokens refreshed successfully",
    data,
  });
});

/**
 * Handles User Logout
 * POST /api/auth/logout
 */
export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  // Decision: We look for the token in the body, but could also check cookies if preferred later
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendResponse({
      res,
      status: 400,
      message: "Refresh token is required to invalidate session",
    });
  }

  await AuthService.logoutUser(refreshToken);

  return sendResponse({
    res,
    message: "Logged out successfully.",
  });
});