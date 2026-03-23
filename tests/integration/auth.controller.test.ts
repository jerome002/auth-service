import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js"; // Ensure you export 'app' from your server file
import { prisma } from "../../src/config/db.js";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

describe("Auth Integration Tests", () => {
  // Rule 10: Clean the test database before running
  beforeAll(async () => {
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and tokens for valid credentials", async () => {
      // 1. Seed a test user
      const hashedPassword = await bcrypt.hash("Password123!", 10);
      const user = await prisma.user.create({
        data: {
          email: "integration@test.com",
          username: "testuser",
          password: hashedPassword,
          firstName: "Test",
          lastName: "User",
          isVerified: true,
          role: Role.USER
        }
      });

      // 2. Hit the login endpoint
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "integration@test.com",
          password: "Password123!"
        });

      // 3. Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user.email).toBe("integration@test.com");
    });

    it("should return 401 for soft-deleted users", async () => {
      // 1. Soft delete the user
      await prisma.user.update({
        where: { email: "integration@test.com" },
        data: { deletedAt: new Date() }
      });

      // 2. Attempt login
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          identifier: "integration@test.com",
          password: "Password123!"
        });

      // 3. Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });
});