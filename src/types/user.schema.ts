import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;