import { Router } from "express";
import {
  createScheduleValidation,
  updateScheduleValidation,
} from "../validators/schedule.validator";
import { validate } from "../middleware/validation.middleware";
import {
  createSchedule,
  deleteSchedule,
  getActiveSchedulesByCourseId,
  getAllSchedules,
  getScheduleById,
  getUpcomingSchedules,
  searchSchedulesAdvanced,
  updateSchedule,
} from "../controllers/schedule.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  registerSchedule,
  getScheduleStudents,
  getEligibleStudentsForSchedule,
  addStudentToSchedule,
  removeStudentFromSchedule,
  getStudentScheduleByCourseId,
  getStudentSchedules,
  getAllSchedulesByStudentId,
} from "../controllers/scheduleRegistration.controller";

const router = Router();

/**
 * @route   POST /api/schedules
 * @desc    Create new schedule
 * @access  Admin
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createScheduleValidation,
  validate,
  createSchedule,
);

/**
 * @route   POST /api/schedules/register
 * @desc    Register schedule for STUDENT
 * @access  All
 */
router.post(
  "/register",
  authenticate,
  authorize("STUDENT"),
  validate,
  registerSchedule
);


/**
 * @route   POST /api/schedules/upcoming
 * @desc    Get 3 schedule
 * @access  All
 */
router.get("/upcoming", validate, getUpcomingSchedules);

/**
 * @route   POST /api/schedule/active-schedule
 * @desc    Get all schedule active
 * @access  All
 */
router.get(
  "/active-schedule",
  getActiveSchedulesByCourseId
);

/**
 * @route   GET /api/schedules/student/course/:courseId
 * @desc    Get student's enrolled schedule by courseId
 * @access  Student
 */
router.get(
  "/student/course/:courseId",
  authenticate,
  authorize("STUDENT"),
  getStudentScheduleByCourseId
);

/**
 * @route   GET /api/schedules/student/my-schedules
 * @desc    Get student's registered schedules
 * @access  Student
 */
router.get(
  "/student/my-schedules",
  authenticate,
  authorize("STUDENT"),
  getStudentSchedules
);

/**
 * @route   GET /api/schedules/student/:studentId/schedules
 * @desc    Get all schedules by studentId via ScheduleRegistration
 * @access  Private (Admin, Teacher, Parent)
 */
router.get(
  "/student/:studentId/schedules",
  authenticate,
  authorize("ADMIN", "TEACHER", "PARENT"),
  getAllSchedulesByStudentId,
);

/**
 * @route   POST /api/schedule
 * @desc    Get all schedule
 * @access  ADMIN
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAllSchedules
);

/**
 * @route   GET /api/schedules/search/advanced
 * @desc    Advanced search schedules by courseName and startDate
 * @access  ADMIN
 */
router.get(
  "/search/advanced",
  authenticate,
  authorize("ADMIN"),
  searchSchedulesAdvanced
);

/**
 * @route   GET /api/schedule/:id
 * @desc    Get schedule by id
 * @access  ADMIN
 */
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getScheduleById
);

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update schedule (chỉ khi chưa có học sinh đăng ký)
 * @access  ADMIN
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateScheduleValidation,
  validate,
  updateSchedule,
);

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete schedule (chỉ khi chưa có học sinh đăng ký)
 * @access  ADMIN
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteSchedule,
);

/**
 * @route   GET /api/schedules/:id/students
 * @desc    Get students registered in a schedule (admin)
 * @access  ADMIN
 */
router.get(
  "/:id/students",
  authenticate,
  authorize("ADMIN"),
  getScheduleStudents
);

/**
 * @route   GET /api/schedules/:id/eligible-students
 * @desc    Get eligible students that can be added to this schedule (admin)
 * @access  ADMIN
 */
router.get(
  "/:id/eligible-students",
  authenticate,
  authorize("ADMIN"),
  getEligibleStudentsForSchedule
);

/**
 * @route   POST /api/schedules/:id/students
 * @desc    Admin adds a student to a schedule
 * @access  ADMIN
 */
router.post(
  "/:id/students",
  authenticate,
  authorize("ADMIN"),
  addStudentToSchedule
);

/**
 * @route   DELETE /api/schedules/:id/students/:studentId
 * @desc    Admin removes a student from a schedule
 * @access  ADMIN
 */
router.delete(
  "/:id/students/:studentId",
  authenticate,
  authorize("ADMIN"),
  removeStudentFromSchedule
);

export default router;