import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { registerUserSchema } from "../schemas/user.schema.js";
import { Role } from "@prisma/client";

export class UserController {
  // Registration
  static async register(req: Request, res: Response) {
    try {
      const parsed = registerUserSchema.parse(req.body);
      const user = await UserService.createUser(parsed);
      return res.status(201).json({
        success: true,
        data: user,
        message: "User created successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to register user",
        errors: [],
      });
    }
  }

  // Get current user (self)
  static async getMe(req: Request, res: Response) {
    try {
      const requesterId = req.user.id; // assume user added by JWT middleware
      const requesterRole = req.user.role as Role;

      const user = await UserService.getUserById(requesterId, requesterRole, requesterId);
      return res.status(200).json({
        success: true,
        data: user,
        message: "Fetched current user",
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: err.message || "Unauthorized",
        errors: [],
      });
    }
  }

  // Get user by ID (admin or self)
  static async getUser(req: Request, res: Response) {
    try {
      const requesterId = req.user.id;
      const requesterRole = req.user.role as Role;
      const userId = Number(req.params.id);

      const user = await UserService.getUserById(userId, requesterRole, requesterId);
      return res.status(200).json({
        success: true,
        data: user,
        message: "Fetched user",
      });
    } catch (err: any) {
      return res.status(403).json({
        success: false,
        message: err.message || "Forbidden",
        errors: [],
      });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    try {
      const requesterId = req.user.id;
      const requesterRole = req.user.role as Role;
      const userId = Number(req.params.id);

      const input = req.body; // assume validated via separate Zod schema if needed
      const user = await UserService.updateUser(userId, requesterRole, requesterId, input);
      return res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to update user",
        errors: [],
      });
    }
  }

  // Delete user
  static async deleteUser(req: Request, res: Response) {
    try {
      const requesterId = req.user.id;
      const requesterRole = req.user.role as Role;
      const userId = Number(req.params.id);

      const result = await UserService.deleteUser(userId, requesterRole, requesterId);
      return res.status(200).json({
        success: true,
        data: result,
        message: "User deleted successfully",
      });
    } catch (err: any) {
      return res.status(403).json({
        success: false,
        message: err.message || "Failed to delete user",
        errors: [],
      });
    }
  }

  // List users (admin-only)
  static async listUsers(req: Request, res: Response) {
    try {
      const requesterRole = req.user.role as Role;
      const skip = Number(req.query.skip) || 0;
      const take = Number(req.query.take) || 50;

      const users = await UserService.listUsers(requesterRole, skip, take);
      return res.status(200).json({
        success: true,
        data: users,
        message: "Fetched users",
      });
    } catch (err: any) {
      return res.status(403).json({
        success: false,
        message: err.message || "Unauthorized",
        errors: [],
      });
    }
  }
}