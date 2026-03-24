import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../src/config/db.js";
import * as AuthService from "../../src/services/auth.service.js";
import bcrypt from "bcrypt";

vi.mock("../../src/config/db.js", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    token: { create: vi.fn() } // Added this to prevent crashes
  },
}));

describe("AuthService - loginUser", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should throw error if user is soft-deleted", async () => {
    // Rule: Our query filter includes { deletedAt: null }
    // So if the user is deleted, Prisma returns null.
    (prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(
      AuthService.loginUser({ 
        identifier: "deleted@test.com", 
        password: "123",
        ipAddress: "127.0.0.1",
        userAgent: "node-test"
      })
    ).rejects.toThrow("Invalid credentials");
  });
});