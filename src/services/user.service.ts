import { User, Role, TokenType } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { logger } from "../utils/logger.util.js";
import { CreateUserDTO, UpdateUserDTO } from "../schemas/user.schema.js";
import { AuthenticationError } from "./auth.service.js";

// Rule 10: Use Omit for consistent Sanitization
export type SanitizedUser = Omit<User, "password">;

const sanitizeUser = (user: User): SanitizedUser => {
  const { password, ...rest } = user;
  return rest;
};

export class UserService {
  /**
   * Creates a user using CreateUserDTO
   */
  static async createUser(input: CreateUserDTO): Promise<SanitizedUser> {
    const existing = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: input.email }, 
          { username: input.username }
        ],
        deletedAt: null 
      },
    });

    if (existing) throw new AuthenticationError("Email or username already taken", 400);

    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Decision: Transaction ensures user exists ONLY if token is created.
    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          ...input,
          email: input.email.toLowerCase().trim(),
          password: hashedPassword,
          role: Role.USER,
          isVerified: false, 
        },
      });

      const vToken = crypto.randomBytes(32).toString("hex");

      await tx.token.create({
        data: {
          token: vToken,
          type: TokenType.VERIFICATION,
          userId: created.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return created;
    });

    logger.info(`User registered successfully: ${newUser.id}`);
    return sanitizeUser(newUser);
  }

  /**
   * Get specific user profile
   */
  static async getUserById(userId: string, requesterRole: Role, requesterId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findFirst({ 
      where: { 
        id: userId,
        deletedAt: null 
      } 
    });
    
    if (!user) throw new AuthenticationError("User not found", 404);

    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new AuthenticationError("Unauthorized access", 403);
    }

    return sanitizeUser(user);
  }

  /**
   * Update user details
   */
  static async updateUser(
    userId: string,
    requesterRole: Role,
    requesterId: string,
    input: UpdateUserDTO
  ): Promise<SanitizedUser> {
    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new AuthenticationError("Unauthorized", 403);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new AuthenticationError("User not found", 404);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { ...input },
    });

    return sanitizeUser(updatedUser);
  }

  /**
   * Soft Delete Implementation
   */
  static async deleteUser(userId: string, requesterRole: Role, requesterId: string) {
    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new AuthenticationError("Unauthorized", 403);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { 
          deletedAt: new Date(),
          isActive: false 
        },
      }),
      prisma.token.deleteMany({
        where: { userId: userId }
      })
    ]);

    logger.info(`User ${userId} soft-deleted.`);
    return { success: true };
  }

  /**
   * Restore soft-deleted account (Admin Only)
   */
  static async restoreUser(userId: string, requesterRole: Role): Promise<SanitizedUser> {
    if (requesterRole !== Role.ADMIN) {
      throw new AuthenticationError("Unauthorized: Only admins can restore accounts", 403);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) throw new AuthenticationError("User not found", 404);
    if (!user.deletedAt) throw new AuthenticationError("User is already active", 400);

    const restoredUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });

    logger.info(`Admin restored user: ${userId}`);
    return sanitizeUser(restoredUser);
  }

  /**
   * List users (Admin only)
   */
  static async listUsers(requesterRole: Role, skip = 0, take = 50): Promise<SanitizedUser[]> {
    if (requesterRole !== Role.ADMIN) throw new AuthenticationError("Admin only", 403);

    const users = await prisma.user.findMany({ 
      where: { deletedAt: null },
      skip, 
      take,
      orderBy: { createdAt: 'desc' } 
    });
    return users.map(sanitizeUser);
  }
} 