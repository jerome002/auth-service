import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { registerUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import { sendResponse } from "../utils/response.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { logger } from "../utils/logger.util.js";

/**
 * @route   POST /api/auth/register
 */
export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerUserSchema.parse(req.body);
  const user = await UserService.createUser(parsed);
  
  logger.info(`New user registered: ${user.email}`);

  return sendResponse({
    res,
    status: 201,
    message: "Registration successful. Please verify your email.",
    data: user,
  });
});

/**
 * @route   GET /api/users/me
 */
export const getMeController = asyncHandler(async (req: Request, res: Response) => {
  // Uses req.user injected by AuthMiddleware
  const user = await UserService.getUserById(req.user.id, req.user.role, req.user.id);
  
  return sendResponse({ res, data: user });
});

/**
 * @route   GET /api/users/:id
 */
export const getUserController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // Destructuring ensures 'id' is treated as a string
  const user = await UserService.getUserById(id as string, req.user.role, req.user.id);
  
  return sendResponse({ res, data: user });
});

/**
 * @route   PUT /api/users/:id
 */
export const updateUserController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedBody = updateUserSchema.parse(req.body);
  
  const user = await UserService.updateUser(id as string, req.user.role, req.user.id, validatedBody);
  
  logger.info(`User updated profile: ${id}`);
  
  return sendResponse({
    res,
    message: "Profile updated successfully",
    data: user,
  });
});

/**
 * @route   DELETE /api/users/:id
 */
export const deleteUserController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await UserService.deleteUser(id as string, req.user.role, req.user.id);
  
  logger.info(`User account soft-deleted: ${id}`);
  
  return sendResponse({ 
    res, 
    message: "User account deactivated successfully." 
  });
});

/**
 * @route   GET /api/users (Admin Only)
 */
export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
  // Rule 10: Explicitly parse query strings to Numbers
  const skip = Number(req.query.skip) || 0;
  const take = Number(req.query.take) || 20;

  const result = await UserService.listUsers(req.user.role, skip, take);
  
  return sendResponse({ res, data: result });
});

/**
 * @route   PATCH /api/users/:id/restore
 */
export const restoreUserController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await UserService.restoreUser(id as string, req.user.role);
  
  return sendResponse({
    res,
    message: "User account restored successfully.",
    data: user
  });
});