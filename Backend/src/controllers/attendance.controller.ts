import { Request, Response } from "express";
import { StudentRequest } from "../middleware/studentAuth.middleware";
import { CustomResponse } from "../config/response.custom";
import {
  generateQRCodeService,
  scanQRCodeService,
  getAttendanceHistoryService,
  getScheduleSessionsAttendanceService,
  manualCheckInService,
  getFullAttendanceHistoryService,
  cancelAttendanceService,
  getStudentAttendanceRecordsService,
  getStudentAttendanceRecordsForParentService,
  getStudentAttendanceByCourseIdService,
} from "../services/attendance.service";
import { GenerateQRInput, ScanQRInput, GetAttendanceHistoryInput, ManualCheckInInput } from "../validators/attendance.validator";
import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";

// Generate QR code for a session (Teacher only)
export const generateQR = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Get teacher ID from user ID
  const teacher = await prisma.teacherInfo.findUnique({
    where: { userId: req.user.id }
  });
  
  if (!teacher) {
    return customRes.error("Không tìm thấy thông tin giáo viên", 404);
  }

  const teacherId = teacher.id;

  const sessionId = Number(req.params.sessionId);
  const actualDate = req.body.date as string | undefined;

  if (isNaN(sessionId)) {
    return customRes.error("Session ID không hợp lệ", 400);
  }

  const result = await generateQRCodeService(sessionId, teacherId, actualDate);

  return customRes.success(result, "Tạo mã QR thành công");
};

// Scan QR code for attendance (Student only)
export const scanQR = async (req: StudentRequest, res: Response) => {
  const customRes = res as CustomResponse;
  const studentId = req.student?.id;

  if (!studentId) {
    return customRes.error("Không tìm thấy thông tin học sinh", 404);
  }

  const { qrCode } = req.body as ScanQRInput;

  const result = await scanQRCodeService(qrCode, studentId);

  if (result.success) {
    return customRes.success(result, result.message);
  } else {
    return customRes.error(result.message, 400);
  }
};

// Check-in with QR code via session ID (Student only) - for camera/QR scanning
export const checkIn = async (req: StudentRequest, res: Response) => {
  const customRes = res as CustomResponse;
  const studentId = req.student?.id;

  console.log('[ATTENDANCE CHECK-IN] Check-in requested:', {
    studentId,
    sessionId: req.params.sessionId,
    qrCodePreview: req.body.qrCode?.substring(0, 30) + '...',
    timestamp: new Date().toISOString()
  });

  if (!studentId) {
    console.log('[ATTENDANCE CHECK-IN] ERROR: No student info found');
    return customRes.error("Không tìm thấy thông tin học sinh", 404);
  }

  const sessionId = Number(req.params.sessionId);
  const { qrCode } = req.body as { qrCode: string };

  console.log('[ATTENDANCE CHECK-IN] Parsed params:', {
    sessionId,
    qrCodeLength: qrCode?.length
  });

  if (isNaN(sessionId)) {
    console.log('[ATTENDANCE CHECK-IN] ERROR: Invalid session ID');
    return customRes.error("Session ID không hợp lệ", 400);
  }

  console.log('[ATTENDANCE CHECK-IN] Calling scanQRCodeService...');
  const result = await scanQRCodeService(qrCode, studentId);

  console.log('[ATTENDANCE CHECK-IN] Service result:', {
    success: result.success,
    message: result.message,
    time: result.time,
    timestamp: new Date().toISOString()
  });

  if (result.success) {
    return customRes.success(result, result.message);
  } else {
    return customRes.error(result.message, 400);
  }
};

// Get attendance history for a session (Teacher only)
export const getAttendanceHistory = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Get teacher ID from user ID
  const teacher = await prisma.teacherInfo.findUnique({
    where: { userId: req.user.id }
  });
  
  if (!teacher) {
    return customRes.error("Không tìm thấy thông tin giáo viên", 404);
  }

  const teacherId = teacher.id;

  const sessionId = Number(req.params.sessionId);

  if (isNaN(sessionId)) {
    return customRes.error("Session ID không hợp lệ", 400);
  }

  const result = await getAttendanceHistoryService(sessionId, teacherId);

  return customRes.success(result, "Lấy lịch sử điểm danh thành công");
};

// Get all sessions with attendance data for a schedule (Teacher only)
export const getScheduleSessionsAttendance = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Get teacher ID from user ID
  const teacher = await prisma.teacherInfo.findUnique({
    where: { userId: req.user.id }
  });
  
  if (!teacher) {
    return customRes.error("Không tìm thấy thông tin giáo viên", 404);
  }

  const teacherId = teacher.id;

  const scheduleId = Number(req.params.scheduleId);

  if (isNaN(scheduleId)) {
    return customRes.error("Schedule ID không hợp lệ", 400);
  }

  const result = await getScheduleSessionsAttendanceService(scheduleId, teacherId);

  return customRes.success(result, "Lấy danh sách buổi học thành công");
};

// Manual check-in for a student (Teacher only)
export const manualCheckIn = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Get teacher ID from user ID
  const teacher = await prisma.teacherInfo.findUnique({
    where: { userId: req.user.id }
  });
  
  if (!teacher) {
    return customRes.error("Không tìm thấy thông tin giáo viên", 404);
  }

  const teacherId = teacher.id;

  const sessionId = Number(req.params.sessionId);
  const { studentId, date } = req.body as ManualCheckInInput & { date?: string };

  if (isNaN(sessionId)) {
    return customRes.error("Session ID không hợp lệ", 400);
  }

  const result = await manualCheckInService(sessionId, studentId, teacherId, date);

  if (result.success) {
    return customRes.success(result, result.message);
  } else {
    return customRes.error(result.message, 400);
  }
};

// Get full attendance history with all registered students (Teacher only)
export const getFullAttendanceHistory = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Get teacher ID from user ID
  const teacher = await prisma.teacherInfo.findUnique({
    where: { userId: req.user.id }
  });
  
  if (!teacher) {
    return customRes.error("Không tìm thấy thông tin giáo viên", 404);
  }

  const teacherId = teacher.id;

  const sessionId = Number(req.params.sessionId);
  const date = req.query.date as string | undefined;

  if (isNaN(sessionId)) {
    return customRes.error("Session ID không hợp lệ", 400);
  }

  const result = await getFullAttendanceHistoryService(sessionId, teacherId, date);

  return customRes.success(result, "Lấy chi tiết điểm danh thành công");
};

// Get student's attendance records (Student only)
export const getStudentAttendance = async (req: StudentRequest, res: Response) => {
  const customRes = res as CustomResponse;
  const studentId = req.student?.id;

  if (!studentId) {
    return customRes.error("Không tìm thấy thông tin học sinh", 404);
  }

  const result = await getStudentAttendanceRecordsService(studentId);

  return customRes.success(result.data, "Lấy lịch sử điểm danh thành công");
};

// Get student's attendance records by student ID (Parent only)
export const getStudentAttendanceForParent = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const parentUserId = req.user?.id;
  const studentId = Number(req.params.studentId);

  if (!parentUserId) {
    return customRes.error("Không tìm thấy thông tin phụ huynh", 404);
  }

  if (isNaN(studentId)) {
    return customRes.error("Student ID không hợp lệ", 400);
  }

  const result = await getStudentAttendanceRecordsForParentService(parentUserId, studentId);

  return customRes.success(result.data, "Lấy lịch sử điểm danh thành công");
};

// Get student's attendance records by courseId (Student only)
export const getStudentAttendanceByCourseId = async (req: StudentRequest, res: Response) => {
  const customRes = res as CustomResponse;
  const studentId = req.student?.id;
  const courseId = Number(req.params.courseId);

  if (!studentId) {
    return customRes.error("Không tìm thấy thông tin học sinh", 404);
  }

  if (isNaN(courseId)) {
    return customRes.error("Course ID không hợp lệ", 400);
  }

  const result = await getStudentAttendanceByCourseIdService(studentId, courseId);

  return customRes.success(result.data, "Lấy lịch sử điểm danh thành công");
};

// Cancel student attendance (Teacher only)
export const cancelAttendance = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Get teacher ID from user ID
  const teacher = await prisma.teacherInfo.findUnique({
    where: { userId: req.user.id }
  });
  
  if (!teacher) {
    return customRes.error("Không tìm thấy thông tin giáo viên", 404);
  }

  const teacherId = teacher.id;

  const sessionId = Number(req.params.sessionId);
  const studentId = Number(req.params.studentId);
  const date = req.body.date as string | undefined;

  if (isNaN(sessionId) || isNaN(studentId)) {
    return customRes.error("Session ID hoặc Student ID không hợp lệ", 400);
  }

  const result = await cancelAttendanceService(sessionId, studentId, teacherId, date);

  if (result.success) {
    return customRes.success(result, result.message);
  } else {
    return customRes.error(result.message, 400);
  }
};
