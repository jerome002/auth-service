import { describe, it, expect, beforeAll } from "vitest";
import { UserService } from "../../../src/services/user.service";
import { prisma } from "../../../src/config/db.js";
import bcrypt from "bcrypt";

describe("UserService", () => {
  let userId: number;

  const userPayload = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    username: "john_doe",
    password: "Password@123",
  };

  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  it("should create a user with hashed password", async () => {
    const user = await UserService.createUser(userPayload);
    expect(user).toHaveProperty("id");
    expect(user.email).toBe(userPayload.email.toLowerCase());
    expect((user as any).passwordHash).not.toBe(userPayload.password);
    const match = await bcrypt.compare(userPayload.password, (user as any).passwordHash);
    expect(match).toBe(true);
    userId = user.id;
  });

  it("should fetch user by ID", async () => {
    const user = await UserService.getUserById(userId, "ADMIN", userId);
    expect(user).toHaveProperty("id", userId);
    expect(user).not.toHaveProperty("passwordHash");
  });
});