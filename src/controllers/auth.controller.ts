import { Request, Response } from "express";
import { loginSchema } from "../schemas/auth.schema.js";
import { loginUser, AuthenticationError } from "../services/auth.service.js";
import { ZodError, ZodIssue } from "zod";

export async function loginController(req: Request, res: Response) {
  try {
    // Validate request body
    const input = loginSchema.parse(req.body);

    // Determine identifier (email or username)
    const identifier = input.email ?? input.username;

    // Extra safety check (even though schema enforces it)
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Email or username must be provided",
      });
    }

    // Call auth service
    const result = await loginUser({
      identifier,
      password: input.password,
    });

    if (result.success) {
      return res.status(200).json(result);
    }

    // Authentication failure
    return res.status(401).json(result);

  } catch (err: unknown) {
    // Handle Zod validation errors (Zod v4 uses "issues")
    if (err instanceof ZodError) {
      const fieldErrors = err.issues.map((e: ZodIssue) => ({
        field: e.path[0],
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: fieldErrors,
      });
    }

    // Handle authentication errors
    if (err instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    // Unexpected errors
    console.error("LoginController Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}