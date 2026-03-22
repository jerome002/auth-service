// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { Role } from "@prisma/client";
const router = Router();

// Mount JWT auth middleware for all user routes
router.use(authenticate); // attaches req.user

/**
 * GET /users/me
 * Get currently logged-in user
 */
router.get("/me", UserController.getMe);

/**
 * GET /users/:id
 * Get user by ID
 * Admin or self only
 */
router.get("/:id", UserController.getUser);

/**
 * PUT /users/:id
 * Update user by ID
 * Admin or self only
 */
router.put("/:id", UserController.updateUser);

/**
 * DELETE /users/:id
 * Delete user by ID
 * Admin or self only
 */
router.delete("/:id", UserController.deleteUser);

/**
 * GET /users
 * List all users (admin-only)
 */
router.get("/", UserController.listUsers);


router.post('/register', UserController.register);

export default router;