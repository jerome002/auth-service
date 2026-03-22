import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../src/server.js";
import { prisma } from "../../../src/config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

describe("User Routes Integration", () => {
  // FIXED: IDs are Strings (UUID)
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Clean slate
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("Password@123", 10);
    
    // FIXED: Match your schema field 'password' and include 'isVerified'
    const user = await prisma.user.create({
      data: {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        username: "alice_smith",
        password: hashedPassword, 
        isActive: true,
        isVerified: true, // Must be true for most logic to pass
        role: Role.ADMIN,
      },
    });

    userId = user.id;
    
    // FIXED: Ensure payload matches what your 'authenticate' middleware expects
    // We use 'sub' for the ID as per standard JWT claims
    token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || "secret", 
      { expiresIn: "1h" }
    );
  });

  it("GET /users/me - returns current user profile", async () => {
    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id", userId);
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("PUT /users/:id - updates user and returns new data", async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "AliceUpdated" });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe("AliceUpdated");
  });

  it("GET /users/me - returns 401 without token", async () => {
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });

  it("GET /users - returns 200 for ADMIN role", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});