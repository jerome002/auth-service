import { describe, it, expect, vi, beforeEach } from "vitest";
import * as AuthService from "../../src/services/auth.service.js";
import { prisma } from "../../src/config/db.js";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

// Mock the entire Prisma Client
vi.mock("../../src/config/db.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe("AuthService - loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw AuthenticationError if user is not found", async () => {
    // Simulate Prisma returning null
    (prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(
      AuthService.loginUser({ identifier: "wrong@test.com", password: "password123" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw error if user is soft-deleted", async () => {
    // Simulate finding a user who HAS a deletedAt date
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "1",
      email: "deleted@test.com",
      deletedAt: new Date(), // Soft-deleted
    });

    // Note: Our service query includes { deletedAt: null }, 
    // so if the DB returns null, the service throws "Invalid credentials"
    await expect(
      AuthService.loginUser({ identifier: "deleted@test.com", password: "123" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw error if password does not match", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: "1",
      email: "user@test.com",
      password: "hashed_password",
      isVerified: true,
      deletedAt: null,
    });

    // Force bcrypt.compare to return false
    vi.spyOn(bcrypt, "compare").mockImplementation(async () => false);

    await expect(
      AuthService.loginUser({ identifier: "user@test.com", password: "wrong_password" })
    ).rejects.toThrow("Invalid credentials");
  });
});