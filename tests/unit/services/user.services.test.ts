import { describe, it, expect, beforeAll } from "vitest";
import { UserService } from "../../../src/services/user.service";
import { prisma } from "../../../src/config/db.js";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

describe("UserService Integration Tests", () => {
  // FIXED: userId must be a string to match UUID/CUID in Prisma
  let userId: string;

  const userPayload = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    username: "john_doe",
    password: "Password@123",
  };

  beforeAll(async () => {
    // Clean database before running integration tests
    await prisma.user.deleteMany();
  });

  it("should create a user with hashed password and default status", async () => {
    const user = await UserService.createUser(userPayload);

    expect(user).toHaveProperty("id");
    expect(user.email).toBe(userPayload.email.toLowerCase());
    
    // FIXED: Check 'password' field, not 'passwordHash'
    // We cast to 'any' here only to verify the hash exists in the DB 
    // before the service sanitizes it, or we check the returned object.
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    
    expect(dbUser?.password).not.toBe(userPayload.password);
    
    const isMatch = await bcrypt.compare(userPayload.password, dbUser!.password);
    expect(isMatch).toBe(true);

    userId = user.id;
  });

  it("should fetch user by ID and sanitize the output", async () => {
    // FIXED: Using Role.ADMIN enum and string userId
    const user = await UserService.getUserById(userId, Role.ADMIN, userId);
    
    expect(user).toHaveProperty("id", userId);
    
    // FIXED: Verify 'password' is removed, not 'passwordHash'
    expect(user).not.toHaveProperty("password");
  });

  it("should throw error if non-admin tries to access another user", async () => {
    await expect(
      UserService.getUserById(userId, Role.USER, "different-uuid")
    ).rejects.toThrow(/unauthorized/i);
  });
});