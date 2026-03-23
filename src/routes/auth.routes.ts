import { Router } from "express";
import { 
  loginController, 
  logoutController, 
  refreshController, 
  verifyEmailController 
} from "../controllers/auth.controller.js";
import { registerController } from "../controllers/user.controller.js";
// import { authRateLimiter } from "../middlewares/rateLimit.middleware.js"; // Decision: Add this later for security

const router = Router();

/**
 * ACCOUNT CREATION & VERIFICATION
 */
router.post("/register", registerController);

// Decision: GET is correct here as it's usually a link clicked in an inbox.
router.get("/verify-email", verifyEmailController);


/**
 * SESSION MANAGEMENT
 * Decision: These should eventually have rate-limiting to prevent brute force.
 */
router.post("/login", loginController);

// Decision: Token rotation (Refresh)
router.post("/refresh", refreshController);

// Decision: Invalidation (Logout)
router.post("/logout", logoutController);

export default router;