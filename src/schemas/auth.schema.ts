import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.email || data.username, {
  message: "Either email or username must be provided",
  path: ["email"],
});

// Inferred Type (Single Source of Truth)
export type LoginDTO = z.infer<typeof loginSchema>;