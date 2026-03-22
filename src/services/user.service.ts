// src/services/user.service.ts
import {User, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";


// Utility to sanitize user
const sanitizeUser = (user: User) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

export class UserService {
  static async createUser(input: { firstName: string; lastName: string; email: string; username: string; password: string; role?: Role }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email.toLowerCase() }, { username: input.username }] },
    });
    if (existing) throw new Error("User exists");

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        ...input,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role ?? Role.USER,
      },
    });

    return sanitizeUser(user);
  }


  // Get user by ID (self or admin)
  static async getUserById(userId: number, requesterRole: Role, requesterId: number): Promise<Omit<User, "passwordHash">> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      // Only self or admin can access
      if (requesterRole !== Role.ADMIN && requesterId !== userId) {
        throw new Error("Unauthorized access");
      }

      return sanitizeUser(user);
    } catch (err) {
      throw new Error("Failed to fetch user");
    }
  }

  // Update user
  static async updateUser(
    userId: number,
    requesterRole: Role,
    requesterId: number,
    input: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      password?: string;
    }
  ): Promise<Omit<User, "passwordHash">> {
    try {
      // Only self or admin
      if (requesterRole !== Role.ADMIN && requesterId !== userId) {
        throw new Error("Unauthorized");
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      // Hash password if updated
      let passwordHash;
      if (input.password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/;
        if (!passwordRegex.test(input.password)) throw new Error("Password complexity requirement failed");
        passwordHash = await bcrypt.hash(input.password, 12);
      }

      // Update fields
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: input.firstName?.trim(),
          middleName: input.middleName?.trim(),
          lastName: input.lastName?.trim(),
          email: input.email?.toLowerCase().trim(),
          username: input.username?.trim(),
          passwordHash: passwordHash ?? undefined,
        },
      });

      return sanitizeUser(updatedUser);
    } catch (err) {
      throw new Error("Failed to update user");
    }
  }

  // Delete user (soft delete recommended, here hard delete for example)
  static async deleteUser(userId: number, requesterRole: Role, requesterId: number): Promise<{ success: boolean }> {
    try {
      // Only self or admin
      if (requesterRole !== Role.ADMIN && requesterId !== userId) {
        throw new Error("Unauthorized");
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      await prisma.user.delete({ where: { id: userId } });

      return { success: true };
    } catch (err) {
      throw new Error("Failed to delete user");
    }
  }

  // List users (admin-only, optionally with pagination)
  static async listUsers(requesterRole: Role, skip = 0, take = 50): Promise<Omit<User, "passwordHash">[]> {
    try {
      if (requesterRole !== Role.ADMIN) throw new Error("Unauthorized");

      const users = await prisma.user.findMany({ skip, take });
      return users.map(sanitizeUser);
    } catch (err) {
      throw new Error("Failed to list users");
    }
  }
}