import { prisma } from "../config/db.js";
import { TokenType } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Custom Error for Authentication specific issues
 */
export class AuthenticationError extends Error {
  constructor(public message: string, public statusCode: number = 401) {
    super(message);
  }
}

/**
 * Private Helper: Generate a short-lived Access Token (JWT)
 */
const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" } // Access tokens should be short-lived
  );
};

/**
 * Private Helper: Generate and Save a new Refresh Token (Session)
 * This avoids duplicate code between loginUser and refreshTokens.
 */
const createSession = async (userId: string) => {
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

  await prisma.token.create({
    data: {
      token: refreshToken,
      type: TokenType.REFRESH,
      userId: userId,
      expiresAt,
    },
  });

  return refreshToken;
};

/**
 * Handles initial login and issues the first session
 */
export async function loginUser({ identifier, password }: any) {
  // 1. Find User by Email or Username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() }
      ],
    },
  });

  if (!user) throw new AuthenticationError("Invalid credentials");

  // 2. The Verification Guardrail
  if (!user.isVerified) {
    throw new AuthenticationError("Please verify your email before logging in.", 403);
  }

  // 3. Verify Password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AuthenticationError("Invalid credentials");

  // 4. Generate Access Token and Create DB Session
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Verifies email using the token sent via MailService
 */
export async function verifyEmail(token: string) {
  // 1. Find the verification token
  const tokenRecord = await prisma.token.findUnique({
    where: { 
      token: token,
      type: TokenType.VERIFICATION 
    },
  });

  // 2. Validate existence and expiry
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AuthenticationError("Invalid or expired verification link.", 400);
  }

  // 3. Atomic Update: Verify User and Clean Up Token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isVerified: true },
    }),
    prisma.token.delete({
      where: { id: tokenRecord.id },
    }),
  ]);

  return { success: true };
}

/**
 * Refresh Token Rotation: Swaps old refresh token for a brand new pair
 */
export async function refreshTokens(oldRefreshToken: string) {
  // 1. Find the token in DB
  const savedToken = await prisma.token.findUnique({
    where: {
      token: oldRefreshToken,
      type: TokenType.REFRESH
    },
    include: { user: true }
  });

  // 2. Validate Token (Exists & Not Expired)
  if (!savedToken || savedToken.expiresAt < new Date()) {
    if (savedToken) await prisma.token.delete({ where: { id: savedToken.id } });
    throw new AuthenticationError("Session expired. Please login again.", 401);
  }

  // 3. ROTATION: Delete the used token immediately (Security best practice)
  await prisma.token.delete({ where: { id: savedToken.id } });

  // 4. Issue new pair using the helper
  const accessToken = generateAccessToken(savedToken.user.id, savedToken.user.role);
  const refreshToken = await createSession(savedToken.user.id);

  return { accessToken, refreshToken };
}

/**
 * Invalidate session on logout
 */
export async function logoutUser(refreshToken: string) {
  try {
    await prisma.token.delete({
      where: { token: refreshToken },
    });
  } catch (err) {
    // If token is already gone, logout is effectively successful
    console.warn("Logout: Token already invalidated or non-existent");
  }
}