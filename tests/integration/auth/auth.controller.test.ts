import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import app from "../../../src/server.js"; 
import { prisma } from "../../../src/config/db.js";
import bcrypt from "bcrypt";
import { User, Role } from "@prisma/client"; // Import types from Prisma

vi.mock("../../../src/config/db.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("bcrypt");

describe("POST /login", () => {
  const mockUser: User = {
    id: 1, // must be a number
    firstName: "John",
    middleName: null,
    lastName: "Doe",
    email: "test@example.com",
    username: "jkapkor",
    role: Role.USER, // match your Prisma enum
    passwordHash: "hashedpassword",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 and JWT for valid credentials", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(true);

    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.body.data).toHaveProperty("token");
  });

  it("returns 401 for invalid credentials", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wrong@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("returns 400 for invalid input", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "invalid-email", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});