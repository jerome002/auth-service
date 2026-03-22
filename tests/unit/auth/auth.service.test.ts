import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcrypt";
import {
  validateUserCredentials,
  generateToken,
  sanitizeUser,
  loginUser,
  AuthenticationError,
} from "../../../src/services/auth.service.js";
import { prisma } from "../../../src/config/db.js";
import { Role, User } from "@prisma/client";

const baseUser: User = {
  id: "uuid-1234",
  firstName: "John",
  middleName: null,
  lastName: "Doe",
  email: "test@example.com",
  username: "jkapkor",
  role: Role.USER,
  password: "hashedpassword", 
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("../../../src/config/db.js", () => ({
  prisma: { user: { findFirst: vi.fn() } },
}));
vi.mock("bcrypt");

describe("Auth Service Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test_secret";
  });

  describe("validateUserCredentials", () => {
    it("returns user for correct credentials", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(baseUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const user = await validateUserCredentials("test@example.com", "password123");
      expect(user.id).toBe(baseUser.id);
    });

    it("throws AuthenticationError for wrong password", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(baseUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(validateUserCredentials("test@example.com", "wrongpass"))
        .rejects.toThrow(/invalid/i);
    });

    it("throws AuthenticationError (403) for unverified user", async () => {
      const unverifiedUser = { ...baseUser, isVerified: false };
      (prisma.user.findFirst as any).mockResolvedValue(unverifiedUser);

      await expect(validateUserCredentials("test", "pass"))
        .rejects.toThrow(/verify/i);
    });

    it("throws AuthenticationError (403) for inactive user", async () => {
      const inactiveUser = { ...baseUser, isActive: false };
      (prisma.user.findFirst as any).mockResolvedValue(inactiveUser);

      await expect(validateUserCredentials("test", "pass"))
        .rejects.toThrow(/deactivated/i);
    });
  });

  describe("loginUser", () => {
    it("returns token and sanitized user on success", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(baseUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await loginUser({ identifier: "test@example.com", password: "password123" });
      
      expect(res).toHaveProperty("token");
      expect(res.user).not.toHaveProperty("password");
      expect(res.user.id).toBe(baseUser.id);
    });
  });

  describe("sanitizeUser", () => {
    it("removes password field", () => {
      const sanitized = sanitizeUser(baseUser);
      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized.email).toBe(baseUser.email);
    });
  });
});