import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import app from "../../../src/server.js"; 
import { prisma } from "../../../src/config/db.js";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

// Mock the database
vi.mock("../../../src/config/db.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock bcrypt for speed and isolation
vi.mock("bcrypt");

describe("Auth Controller - POST /auth/login", () => {
  const mockUser = {
    id: "uuid-123",
    firstName: "John",
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

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test_secret";
  });

  it("should return 200 and a token for valid credentials", async () => {
    // Setup: Database finds user, bcrypt confirms password
    (prisma.user.findFirst as any).mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(true);

    const res = await request(app)
      .post("/auth/login")
      .send({ 
        email: "test@example.com", 
        password: "password123" 
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toHaveProperty("email", mockUser.email);
    // Safety check: ensure password didn't leak
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("should return 401 for incorrect password", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(false);

    const res = await request(app)
      .post("/auth/login")
      .send({ 
        email: "test@example.com", 
        password: "wrongpassword" 
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("should return 400 for malformed input (Zod validation)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ 
        email: "not-an-email", 
        password: "short" 
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty("errors");
  });
});