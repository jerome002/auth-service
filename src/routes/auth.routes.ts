import { Router } from "express";
import { 
  loginController, 
  logoutController, 
  refreshController, 
  verifyEmailController,
  getSessionsController, // Added these imports
  revokeSessionController 
} from "../controllers/auth.controller.js";
import { registerController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * ACCOUNT CREATION & VERIFICATION
 */
router.post("/register", registerController);

// Clicked via email link
router.get("/verify-email", verifyEmailController);

/**
 * AUTHENTICATION (Stateless)
 */
router.post("/login", loginController);

// Token rotation (Refresh)
router.post("/refresh", refreshController);

// Invalidation (Logout)
router.post("/logout", logoutController);

/**
 * SESSION MANAGEMENT (Stateful/Protected)
 * Allows users to view and revoke active devices.
 */
router.get("/sessions", authenticate, getSessionsController);
router.delete("/sessions/:id", authenticate, revokeSessionController);

export default router;