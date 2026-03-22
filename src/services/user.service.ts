import { User, Role, TokenType } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { MailService } from "./mail.service.js"; // Import the new service

// Senior Tip: Use Omit to ensure type safety across the service
export type SanitizedUser = Omit<User, "password">;

const sanitizeUser = (user: User): SanitizedUser => {
  const { password, ...rest } = user;
  return rest;
};

export class UserService {
  /**
   * Creates a user, generates a token, and sends the verification email.
   */
  static async createUser(input: any): Promise<SanitizedUser> {
    // 1. Check for duplicates
    const existing = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: input.email.toLowerCase().trim() }, 
          { username: input.username.trim() }
        ] 
      },
    });

    if (existing) throw new Error("User with this email or username already exists");

    // 2. Hash Password (Round 12 is industry standard)
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // 3. Database Transaction
    // Ensures that if the token creation fails, the user isn't left stranded in the DB.
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: input.firstName.trim(),
          middleName: input.middleName?.trim(),
          lastName: input.lastName.trim(),
          email: input.email.toLowerCase().trim(),
          username: input.username.trim(),
          password: hashedPassword,
          role: input.role ?? Role.USER,
          isVerified: false, 
          isActive: true,
        },
      });

      const vToken = crypto.randomBytes(32).toString("hex");

      await tx.token.create({
        data: {
          token: vToken,
          type: TokenType.VERIFICATION,
          userId: newUser.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
        },
      });

      return { user: newUser, verificationToken: vToken };
    });

    // 4. Trigger Email (Fire and Forget)
    // We don't 'await' this so the user gets a fast response from the API.
    // Errors are caught and logged without crashing the registration process.
    MailService.sendVerificationEmail(result.user.email, result.verificationToken)
      .catch((err) => console.error("[MailService Error]: Failed to send verification email:", err));

    return sanitizeUser(result.user);
  }

  static async getUserById(userId: string, requesterRole: Role, requesterId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new Error("Unauthorized access");
    }

    return sanitizeUser(user);
  }

  static async updateUser(
    userId: string,
    requesterRole: Role,
    requesterId: string,
    input: Partial<User & { newPassword?: string }>
  ): Promise<SanitizedUser> {
    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let updatedPassword = undefined;
    if (input.newPassword) {
      updatedPassword = await bcrypt.hash(input.newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName?.trim() || user.firstName,
        middleName: input.middleName?.trim() || user.middleName,
        lastName: input.lastName?.trim() || user.lastName,
        username: input.username?.trim() || user.username,
        password: updatedPassword ?? user.password,
      },
    });

    return sanitizeUser(updatedUser);
  }

  static async deleteUser(userId: string, requesterRole: Role, requesterId: string) {
    if (requesterRole !== Role.ADMIN && requesterId !== userId) {
      throw new Error("Unauthorized");
    }

    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  static async listUsers(requesterRole: Role, skip = 0, take = 50): Promise<SanitizedUser[]> {
    if (requesterRole !== Role.ADMIN) throw new Error("Unauthorized access: Admin only");

    const users = await prisma.user.findMany({ 
      skip, 
      take,
      orderBy: { createdAt: 'desc' } 
    });
    return users.map(sanitizeUser);
  }
}