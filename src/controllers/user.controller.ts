import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { registerUserSchema } from "../schemas/user.schema.js";
import { ZodError } from "zod";

/**
 * @route   POST /api/auth/register
 * @desc    Public Registration - Triggers UserService to create user and send email
 */
export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerUserSchema.parse(req.body);
    const user = await UserService.createUser(parsed);
    
    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: user,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
}

/**
 * @route   GET /api/users/me
 * @desc    Get current logged-in user profile
 */
export async function getMeController(req: Request, res: Response) {
  try {
    // Note: req.user comes from your AuthMiddleware (next step)
    const user = await UserService.getUserById(req.user.id, req.user.role, req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

/**
 * @route   GET /api/users/:id
 */
export async function getUserController(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const user = await UserService.getUserById(id, req.user.role, req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    return res.status(403).json({ success: false, message: err.message });
  }
}

/**
 * @route   PUT /api/users/:id
 */
export async function updateUserController(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const user = await UserService.updateUser(id, req.user.role, req.user.id, req.body);
    
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * @route   DELETE /api/users/:id
 */
export async function deleteUserController(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const result = await UserService.deleteUser(id, req.user.role, req.user.id);
    return res.status(200).json({ success: true, data: result, message: "User deleted" });
  } catch (err: any) {
    return res.status(403).json({ success: false, message: err.message });
  }
}

/**
 * @route   GET /api/users (Admin Only)
 */
export async function listUsersController(req: Request, res: Response) {
  try {
    const skip = Number(req.query.skip) || 0;
    const take = Number(req.query.take) || 20;

    const users = await UserService.listUsers(req.user.role, skip, take);
    return res.status(200).json({ success: true, data: users });
  } catch (err: any) {
    return res.status(403).json({ success: false, message: err.message });
  }
}