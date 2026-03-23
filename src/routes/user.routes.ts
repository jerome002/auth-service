import { Router } from "express";
import { 
  getMeController, 
  getUserController, 
  updateUserController, 
  deleteUserController, 
  listUsersController,
  restoreUserController // Added the new restore action
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

/**
 * 1. PROTECTED ROUTES (Logged-in Users Only)
 */
router.use(authenticate); 

// Get own profile
router.get("/me", getMeController);

// Get specific user (Logic inside: Self or Admin)
router.get("/:id", getUserController);

// Update profile (Logic inside: Self or Admin)
router.put("/:id", updateUserController);

// Delete/Deactivate account (Logic inside: Self or Admin)
// Decision: Removed authorize(Role.ADMIN) so users can delete their own accounts.
router.delete("/:id", deleteUserController);


/**
 * 2. ADMIN ONLY ROUTES
 */

// List all users
router.get("/", authorize(Role.ADMIN), listUsersController);

// Restore a soft-deleted user
// Decision: PATCH is used here as we are partially updating the 'deletedAt' state.
router.patch("/:id/restore", authorize(Role.ADMIN), restoreUserController);

export default router;