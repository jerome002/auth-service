import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcrypt";
import {
  validateUserCredentials,
  generateToken,
  sanitizeUser,
  loginUser,
  AuthenticationError,
} from "../../../src/services/auth.service";
import { prisma } from "../../../src/config/db.js";
import { Role, User } from "@prisma/client";

// Type-safe mock user
const mockUser: User = {
  id: 1,
  firstName: "John",
  middleName: null,
  lastName: "Doe",
  email: "test@example.com",
  username: "jkapkor",
  role: Role.USER,
  passwordHash: "hashedpassword",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};


// Mock Prisma
vi.mock("../../../src/config/db.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock("bcrypt");

describe("validateUserCredentials", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns user for correct credentials", async () => {
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const user = await validateUserCredentials("test@example.com", "password123");
    expect(user).toEqual(mockUser);
  });

  it("throws AuthenticationError for wrong password", async () => {
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await expect(validateUserCredentials("test@example.com", "wrongpass")).rejects.toThrow(
      AuthenticationError
    );
  });

  it("throws AuthenticationError for nonexistent user", async () => {
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      validateUserCredentials("nonexistent@example.com", "password123")
    ).rejects.toThrow(AuthenticationError);
  });
});

describe("generateToken", () => {
  it("returns a valid JWT token", () => {
    const user = { id: "1", email: "test@example.com" };
    const token = generateToken(user);
    expect(typeof token).toBe("string");
  });
});

describe("sanitizeUser", () => {
  it("removes password and returns safe fields", () => {
    const user = { ...mockUser };
    const sanitized = sanitizeUser(user);
    expect(sanitized).not.toHaveProperty("passwordHash");
    expect(sanitized).toHaveProperty("id");
    expect(sanitized).toHaveProperty("email");
    expect(sanitized).toHaveProperty("username");
  });
});

describe("loginUser", () => {
  it("returns success and token for valid credentials", async () => {
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await loginUser({ identifier: "test@example.com", password: "password123" });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.token).toBeDefined();
    expect(res.data!.user).not.toHaveProperty("passwordHash");
  });

  it("returns generic error for invalid credentials", async () => {
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await loginUser({ identifier: "nonexistent@example.com", password: "password123" });
    expect(res.success).toBe(false);
    expect(res.message).toBe("Invalid credentials");
  });
});