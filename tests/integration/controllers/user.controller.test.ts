import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app  from "../../../src/server.js";
import { prisma } from "../../../src/config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("User Routes", () => {
  let token: string;
  let userId: number;

  beforeAll(async () => {
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("Password@123", 10);
    const user = await prisma.user.create({
      data: {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        username: "alice_smith",
        passwordHash: hashedPassword,
        isActive: true,
        role: "ADMIN",
      },
    });

    userId = user.id;
    token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
  });

  it("GET /users/me returns current user", async () => {
    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", userId);
  });

  it("PUT /users/:id updates user", async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "AliceUpdated" });
    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe("AliceUpdated");
  });
});