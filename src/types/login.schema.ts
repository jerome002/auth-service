import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6),
}).refine((data) => data.email || data.username, {
  message: "Either email or username is required",
});

export type LoginDTO = z.infer<typeof loginSchema>;