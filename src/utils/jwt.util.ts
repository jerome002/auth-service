import jwt from "jsonwebtoken";
import { PRIVATE_KEY, PUBLIC_KEY } from "../config/jwt.config.js";
import { Role } from "@prisma/client";

/**
 * Standard Token Payload Structure
 * Rule 2: Consistent Metadata
 */
export interface TokenPayload {
  sub: string;    // User ID
  email: string;
  role: Role;
  iss: string;    // Issuer
  aud: string;    // Audience
}

const ISSUER = "finflow-auth-service";
const AUDIENCE = "finflow-client-apps";

/**
 * Signs a new RS256 Token
 */
export const signToken = (user: { id: string; email: string; role: Role }): string => {
  const payload: Partial<TokenPayload> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iss: ISSUER,
    aud: AUDIENCE,
  };

  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "15m",
    keyid: "v1",
  });
};

/**
 * Verifies an RS256 Token
 */
export const verifyToken = (token: string): TokenPayload => {
  // Logic is centralized here to avoid duplication in middleware
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ["RS256"],
    issuer: ISSUER,
  }) as TokenPayload;
};