import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../../src/utils/jwt.util.js";
import { Role } from "@prisma/client";

describe("JWT Utility (RS256)", () => {
  const mockUser = { 
    id: "user-123", 
    email: "test@example.com", 
    role: Role.USER 
  };

  it("should sign a token and return a valid JWT string", () => {
    const token = signToken(mockUser);
    
    // A JWT always has 3 parts separated by dots
    expect(token.split(".").length).toBe(3);
    expect(typeof token).toBe("string");
  });

  it("should verify a valid token and return the correct payload", () => {
    const token = signToken(mockUser);
    const decoded = verifyToken(token);

    // Assert standard claims and custom payload
    expect(decoded.sub).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(Role.USER);
    expect(decoded.iss).toBe("finflow-auth-service");
    expect(decoded.aud).toBe("finflow-client-apps");
  });

  it("should throw an error if the token is tampered with", () => {
    const validToken = signToken(mockUser);
    const tamperedToken = validToken + "extra_chars";

    expect(() => verifyToken(tamperedToken)).toThrow();
  });
});