
import { z } from "zod";

// Registration schema
export const registerUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .trim(),

  middleName: z
    .string()
    .min(2, "Middle name must be at least 2 characters")
    .max(50, "Middle name cannot exceed 50 characters")
    .trim()
    .optional(),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password cannot exceed 32 characters"),
}).strict(); // ensures no extra fields are allowed