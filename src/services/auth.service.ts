import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

// Custom authentication error
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Validate email/username and password
export async function validateUserCredentials(identifier: string, password: string): Promise<User> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  const invalidError = new AuthenticationError("Invalid credentials");

  if (!user) throw invalidError;

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw invalidError;

  return user;
}

// Generate JWT token
export function generateToken(user: { id: string; email: string }): string {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");

  const payload = { userId: user.id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Remove sensitive fields before sending user to client
export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

// Login function
export async function loginUser(input: { identifier: string; password: string }) {
  try {
    const user = await validateUserCredentials(input.identifier, input.password);
    const token = generateToken({ id: user.id.toString(), email: user.email });
    const safeUser = sanitizeUser(user);

    return {
      success: true,
      data: { token, user: safeUser },
      message: "Login successful",
    };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return { success: false, message: "Invalid credentials" };
    }

    console.error(err); // internal logging
    return { success: false, message: "Internal server error" };
  }
}