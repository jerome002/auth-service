import { Router } from "express";
import { 
  getMeController, 
  getUserController, 
  updateUserController, 
  deleteUserController, 
  listUsersController 
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

/**
 * PROTECTED ROUTES (Logged-in Users Only)
 * All routes defined below this middleware require a valid Bearer Token.
 */
router.use(authenticate); 

// 1. Get own profile (Context-aware: uses req.user.id)
router.get("/me", getMeController);

// 2. Get specific user 
// Controller logic allows a user to see their own profile OR an Admin to see any.
router.get("/:id", getUserController);

// 3. Update profile
// Controller logic allows a user to update their own profile OR an Admin to update any.
router.put("/:id", updateUserController);


/**
 * ADMIN ONLY ROUTES
 * These require both a valid token AND the Role.ADMIN in the JWT payload.
 */

// 4. List all users (with pagination)
router.get("/", authorize(Role.ADMIN), listUsersController);

// 5. Delete user
// Note: We use authorize(Role.ADMIN) here because deleting is a high-stakes action.
router.delete("/:id", authorize(Role.ADMIN), deleteUserController);

export default router;