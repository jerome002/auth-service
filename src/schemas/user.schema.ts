import { z } from "zod";

export const registerUserSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  middleName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().transform((val) => val.toLowerCase().trim()),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).trim(),
  password: z.string().min(8).max(32),
}).strict();

// Inferred Type
export type CreateUserDTO = z.infer<typeof registerUserSchema>;

/**
 * Update Schema Logic:
 * We reuse the registration schema but make everything optional.
 * We OMIT the password and email to prevent unauthorized changes 
 * during a standard profile update.
 */
export const updateUserSchema = registerUserSchema
  .partial()
  .omit({ password: true, email: true });

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;