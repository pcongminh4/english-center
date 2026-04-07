import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getAllUsersController,
  getMyUserController,
  updateMyUserController,
} from "../controllers/user.controller";
import { validate } from "../middleware/validation.middleware";
import { updateUserValidation } from "../validators/user.validator";

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get("/", authenticate, authorize("ADMIN"), getAllUsersController);

/**
 * @route   GET /api/user/me
 * @desc    Get current admin profile
 * @access  Private (Admin only)
 */
router.get("/me", authenticate, authorize("ADMIN"), getMyUserController);

/**
 * @route   PUT /api/user/me
 * @desc    Update current admin profile
 * @access  Private (Admin only)
 */
router.put(
  "/me",
  authenticate,
  authorize("ADMIN"),
  updateUserValidation,
  validate,
  updateMyUserController,
);

export default router;
