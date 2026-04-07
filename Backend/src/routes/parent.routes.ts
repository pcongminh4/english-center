import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createParentValidation,
  updateParentValidation,
} from "../validators/parent.validator";
import {
  createParent,
  getAllParents,
  getParentMe,
  getParentById,
  updateParent,
  updateParentMe,
  deleteParent,
  linkStudentToParent,
  unlinkStudentFromParent,
} from "../controllers/parent.controller";

const router = Router();

/**
 * @route   POST /api/parents
 * @desc    Tạo phụ huynh mới
 * @access  Private (Admin only)
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createParentValidation,
  validate,
  createParent,
);

/**
 * @route   GET /api/parents
 * @desc    Lấy danh sách phụ huynh
 * @access  Private (Admin, Teacher)
 */
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), getAllParents);

/**
 * @route   GET /api/parents/me
 * @desc    Lấy thông tin phụ huynh hiện tại
 * @access  Private (Parent)
 */
router.get("/me", authenticate, authorize("PARENT"), getParentMe);

/**
 * @route   PUT /api/parents/me
 * @desc    Cập nhật phụ huynh hiện tại
 * @access  Private (Parent)
 */
router.put(
  "/me",
  authenticate,
  authorize("PARENT"),
  updateParentValidation,
  validate,
  updateParentMe,
);

/**
 * @route   GET /api/parents/:id
 * @desc    Lấy thông tin phụ huynh theo ID
 * @access  Private (Admin, Teacher, Parent - chỉ xem chính mình)
 */
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER", "PARENT"),
  getParentById,
);

/**
 * @route   PUT /api/parents/:id
 * @desc    Cập nhật phụ huynh
 * @access  Private (Admin, Parent - chỉ cập nhật chính mình)
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "PARENT"),
  updateParentValidation,
  validate,
  updateParent,
);

/**
 * @route   DELETE /api/parents/:id
 * @desc    Xóa phụ huynh (soft delete)
 * @access  Private (Admin only)
 */
router.delete("/:id", authenticate, authorize("ADMIN"), deleteParent);

/**
 * @route   POST /api/parents/:parentId/students/:studentId
 * @desc    Liên kết học sinh với phụ huynh
 * @access  Private (Admin only)
 */
router.post(
  "/:parentId/students/:studentId",
  authenticate,
  authorize("ADMIN"),
  linkStudentToParent,
);

/**
 * @route   DELETE /api/parents/:parentId/students/:studentId
 * @desc    Hủy liên kết học sinh với phụ huynh
 * @access  Private (Admin only)
 */
router.delete(
  "/:parentId/students/:studentId",
  authenticate,
  authorize("ADMIN"),
  unlinkStudentFromParent,
);

export default router;
