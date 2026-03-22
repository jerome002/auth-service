import { describe, it, expect } from "vitest";
import request from "supertest";
// FIX: Go up 3 levels to reach the project root, then into src
import app from "../../src/server.js"; 
import { prisma } from "../../src/config/db.js";

describe("End-to-End User Flow", () => {
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: "flow@example.com",
    username: "flowuser",
    password: "Password123!",
  };

  it("should complete a full registration and login cycle", async () => {
    // 1. Clean up (Self-contained test)
    await prisma.user.deleteMany({ 
      where: { 
        OR: [
          { email: testUser.email },
          { username: testUser.username }
        ] 
      } 
    });

    // 2. Register
    const regRes = await request(app)
      .post("/users/register")
      .send(testUser);
    
    expect(regRes.status).toBe(201);

    // 3. Manually Verify (Since we haven't built the verification endpoint yet)
    await prisma.user.update({
      where: { email: testUser.email },
      data: { isVerified: true }
    });

    // 4. Login
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        identifier: testUser.email,
        password: testUser.password
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
    
    const token = loginRes.body.data.token;

    // 5. Use Token to get Profile (The ultimate test of the middleware + service)
    const meRes = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(testUser.email);
    expect(meRes.body.data).not.toHaveProperty("password");
  });
});