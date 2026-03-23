import { prisma } from "../config/db.js";
import { TokenType } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { signToken } from "../utils/jwt.util.js";
import { logger } from "../utils/logger.util.js"; // Decision: Centralized logging

/**
 * Custom Error for Authentication specific issues
 */
export class AuthenticationError extends Error {
  constructor(public message: string, public statusCode: number = 401) {
    super(message);
  }
}

/**
 * Private Helper: Generate and Save a new Refresh Token (Session)
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
 * Handles initial login
 */
export async function loginUser({ identifier, password }: any) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() }
      ],
      deletedAt: null,
    },
  });

  if (!user) {
    logger.warn(`Login failed: User not found or soft-deleted [Identifier: ${identifier}]`);
    throw new AuthenticationError("Invalid credentials");
  }

  if (!user.isVerified) {
    logger.warn(`Login blocked: Email not verified [User: ${user.id}]`);
    throw new AuthenticationError("Please verify your email before logging in.", 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn(`Login failed: Invalid password [User: ${user.id}]`);
    throw new AuthenticationError("Invalid credentials");
  }

  const accessToken = signToken(user); 
  const refreshToken = await createSession(user.id);

  logger.info(`Login successful [User: ${user.id}]`);
  
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
 * Verifies email using the token
 */
export async function verifyEmail(token: string) {
  const tokenRecord = await prisma.token.findUnique({
    where: { 
      token: token,
      type: TokenType.VERIFICATION 
    },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    logger.warn(`Email verification failed: Invalid or expired token`);
    throw new AuthenticationError("Invalid or expired verification link.", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isVerified: true },
    }),
    prisma.token.delete({
      where: { id: tokenRecord.id },
    }),
  ]);

  logger.info(`Email verified successfully [User: ${tokenRecord.userId}]`);
  return { success: true };
}

/**
 * Refresh Token Rotation (RS256)
 */
export async function refreshTokens(oldRefreshToken: string) {
  const savedToken = await prisma.token.findUnique({
    where: {
      token: oldRefreshToken,
      type: TokenType.REFRESH
    },
    include: { user: true }
  });

  if (!savedToken || savedToken.expiresAt < new Date() || savedToken.user.deletedAt !== null) {
    if (savedToken) {
      await prisma.token.delete({ where: { id: savedToken.id } });
      logger.warn(`Session revoked: Refresh attempted on expired/deleted account [User: ${savedToken.userId}]`);
    }
    throw new AuthenticationError("Session expired or account deactivated. Please login again.", 401);
  }

  // Security: Delete used refresh token immediately (Rotation)
  await prisma.token.delete({ where: { id: savedToken.id } });

  const accessToken = signToken(savedToken.user);
  const refreshToken = await createSession(savedToken.user.id);

  logger.debug(`Token rotation successful [User: ${savedToken.userId}]`);
  return { accessToken, refreshToken };
}

/**
 * Invalidate session on logout
 */
export async function logoutUser(refreshToken: string) {
  try {
    const deleted = await prisma.token.delete({
      where: { token: refreshToken },
    });
    logger.info(`Logout successful [User: ${deleted.userId}]`);
  } catch (err) {
    logger.warn("Logout: Token already invalidated or non-existent");
  }
}