import { Router } from "express";
import {
  generateQR,
  scanQR,
  checkIn,
  getAttendanceHistory,
  getScheduleSessionsAttendance,
  manualCheckIn,
  getFullAttendanceHistory,
  cancelAttendance,
  getStudentAttendance,
  getStudentAttendanceForParent,
  getStudentAttendanceByCourseId,
} from "../controllers/attendance.controller";
import { validate, validateZod } from "../middleware/validation.middleware";
import { generateQRSchema, scanQRSchema, manualCheckInSchema } from "../validators/attendance.validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { authenticateStudent } from "../middleware/studentAuth.middleware";

const router = Router();

// Teacher routes
router.post(
  "/generate-qr/:sessionId",
  authenticate,
  authorize("TEACHER"),
  generateQR
);

router.get(
  "/history/:sessionId",
  authenticate,
  authorize("TEACHER"),
  getAttendanceHistory
);

router.get(
  "/sessions/:scheduleId",
  authenticate,
  authorize("TEACHER"),
  getScheduleSessionsAttendance
);

router.post(
  "/manual-checkin/:sessionId",
  authenticate,
  authorize("TEACHER"),
  validateZod(manualCheckInSchema),
  manualCheckIn
);

router.get(
  "/full-history/:sessionId",
  authenticate,
  authorize("TEACHER"),
  getFullAttendanceHistory
);

router.delete(
  "/cancel/:sessionId/:studentId",
  authenticate,
  authorize("TEACHER"),
  cancelAttendance
);

// Student routes
router.post("/scan-qr", authenticateStudent, validateZod(scanQRSchema), scanQR);
router.post("/checkin/:sessionId", authenticateStudent, checkIn);
router.get("/student", authenticateStudent, getStudentAttendance);
router.get("/student/course/:courseId", authenticateStudent, getStudentAttendanceByCourseId);

// Parent routes
router.get(
  "/parent/student/:studentId",
  authenticate,
  authorize("PARENT"),
  getStudentAttendanceForParent
);

export default router;
