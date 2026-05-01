import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
} from "../controllers/authController";
import { protect } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
