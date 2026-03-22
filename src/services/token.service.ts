import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export class TokenService {
  private static readonly SECRET = process.env.JWT_SECRET || "super_secret_fallback";
  private static readonly EXPIRES_IN = "1h";

  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.SECRET, { expiresIn: this.EXPIRES_IN });
  }

  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.SECRET) as TokenPayload;
    } catch (err) {
      throw new Error("Invalid or expired token");
    }
  }
}