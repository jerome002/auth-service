// src/schemas/auth.schema.ts
import { z } from "zod";

// Login schema: accepts either email or username, plus password
export const loginSchema = z.object({
  email: z.string().email().optional(), // optional if username is provided
  username: z.string().min(3).optional(), // optional if email is provided
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.email || data.username, {
  message: "Either email or username must be provided",
  path: ["email"], // error will appear on email field
});

