import { Router } from "express";
import { 
  loginController, 
  logoutController, 
  refreshController, 
  verifyEmailController 
} from "../controllers/auth.controller.js";
import { registerController } from "../controllers/user.controller.js";

const router = Router();

// Public Registration
router.post("/register", registerController);

// Email Verification (Clicked from email link)
router.get("/verify-email", verifyEmailController);

// Login
router.post("/login", loginController);

// Token Rotation
router.post("/refresh", refreshController);

// Logout
router.post("/logout", logoutController);

export default router;