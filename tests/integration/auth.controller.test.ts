import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js"; 
import { prisma } from "../../src/config/db.js";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and capture metadata", async () => {
      const password = "Password123!";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
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

      const response = await request(app)
        .post("/api/auth/login")
        .set('User-Agent', 'Sentinel-Test-Agent') // Metadata Rule
        .send({
          identifier: "integration@test.com",
          password: password
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("accessToken");
      
      // Verify metadata was actually saved to Neon
      const tokenRecord = await prisma.token.findFirst({
        where: { user: { email: "integration@test.com" } }
      });
      expect(tokenRecord?.userAgent).toBe('Sentinel-Test-Agent');
    });
  });
});