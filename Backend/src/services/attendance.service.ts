import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { generateQRString, isQRExpired, parseQRString } from "../utils/qrGenerator";

/**
 * Create a Date object with time set as Vietnam time (UTC+7)
 * @param date - The base date
 * @param timeString - Time string in format "HH:MM" (Vietnam time)
 * @returns A Date object representing the session time in Vietnam timezone
 */
function setVietnamTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create new date from the base date
  const result = new Date(date);
  
  // Set time using UTC methods to avoid timezone issues
  // Vietnam is UTC+7, so if Vietnam time is 16:00, UTC time is 09:00
  // When hours < 7 (e.g., 01:10 VN), UTC is previous day (18:10)
  const offset = hours - 7;
  if (offset < 0) {
    // VN time is before 7:00 AM → UTC is previous day
    result.setUTCDate(result.getUTCDate() - 1);
    result.setUTCHours(offset + 24, minutes, 0, 0);
  } else {
    result.setUTCHours(offset, minutes, 0, 0);
  }
  
  return result;
}

/**
 * Calculate the actual date for a session based on schedule start date and day of week
 * @param scheduleStart - The start date of schedule
 * @param dayOfWeek - The day of week (MONDAY, TUESDAY, etc.)
 * @returns The actual date of session (set to 00:00:00 local time to avoid timezone issues)
 */
function calculateSessionDate(scheduleStart: Date, dayOfWeek: string): Date {
  const daysMap: { [key: string]: number } = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0, // 0 for Sunday in JavaScript
  };

  const targetDay = daysMap[dayOfWeek];
  if (targetDay === undefined) {
    return scheduleStart;
  }

  // Use local timezone by parsing the date string
  const result = new Date(scheduleStart.getFullYear(), scheduleStart.getMonth(), scheduleStart.getDate());
  const currentDay = result.getDay();
  
  // Calculate days to add to reach target day
  let daysToAdd = targetDay - currentDay;
  
  // If target day is earlier in the week than current day, add a week
  // Only add 7 days if daysToAdd < 0, not when it's 0 (same day)
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  result.setDate(result.getDate() + daysToAdd);
  
  // Set time to 00:00:00 to avoid timezone issues when comparing dates
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * Check if the current time is past the session end time
 * @param sessionDate - The date of the session
 * @param endTime - The end time string (e.g., "14:00") in Vietnam time
 * @returns True if current time is past session end time
 */
function isSessionExpired(sessionDate: Date, endTime: string): boolean {
  const now = new Date();
  
  // Calculate session end time using Vietnam timezone
  const sessionEndTime = setVietnamTime(sessionDate, endTime);
  
  // Check if current time is past the session end time
  return now.getTime() > sessionEndTime.getTime();
}


/**
 * Generate QR code for a schedule session
 * Only teacher of schedule can generate QR
 */
export const generateQRCodeService = async (
  sessionId: number,
  teacherId: number,
  actualDate?: string
) => {
  // Check session exists and belongs to teacher
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      schedule: true,
    },
  });

  if (!session) {
    throw new AppError("Không tìm thấy buổi học", 404);
  }

  if (session.schedule.teacherId !== teacherId) {
    throw new AppError("Bạn không có quyền tạo QR cho buổi học này", 403);
  }

  // Calculate actual session date
  // Use provided actualDate if available, otherwise calculate from schedule start
  let sessionDate: Date;
  if (actualDate) {
    sessionDate = new Date(actualDate);
    // Use setUTCHours to avoid timezone offset issues when normalizing date
    sessionDate.setUTCHours(0, 0, 0, 0);
  } else {
    sessionDate = calculateSessionDate(
      session.schedule.startTime,
      session.day
    );
  }
  
  // Check if current time is within session hours
  const now = new Date();
  const sessionStartTime = setVietnamTime(sessionDate, session.startTime);
  const sessionEndTime = setVietnamTime(sessionDate, session.endTime);

  if (now.getTime() < sessionStartTime.getTime()) {
    throw new AppError("Buổi học chưa bắt đầu, không thể tạo QR", 400);
  }

  if (now.getTime() > sessionEndTime.getTime()) {
    throw new AppError("Buổi học đã kết thúc, không thể tạo QR", 400);
  }

  // Check if QR already exists for this session date
  const existingAttendance = await prisma.scheduleAttendance.findFirst({
    where: {
      scheduleDayId: sessionId,
      date: sessionDate,
    },
  });

  // Always generate new QR code when teacher requests
  // This ensures fresh timestamp for expiry timer

  // Generate new QR code
  const qrCode = generateQRString(sessionId);

  // Create or update attendance record with actual date
  // Update createdAt to reset QR expiry timer when regenerating
  const attendance = await prisma.scheduleAttendance.upsert({
    where: {
      id: existingAttendance?.id || 0,
    },
    update: {
      qrCode,
      createdAt: new Date(),
    },
    create: {
      scheduleDayId: sessionId,
      date: sessionDate, // Store actual date
      qrCode,
      totalAbsent: 0,
      createdAt: new Date(), // Explicit timestamp for QR expiry calculation
    },
  });

  return {
    qrCode: attendance.qrCode,
    sessionId: attendance.scheduleDayId,
  };
};

/**
 * Student scans QR code for attendance
 * Idempotent: only one scan per session per student
 */
export const scanQRCodeService = async (
  qrCode: string,
  studentId: number
): Promise<{ success: boolean; message: string; time?: string }> => {
  // Parse QR code
  const parsedQR = parseQRString(qrCode);

  if (!parsedQR) {
    return {
      success: false,
      message: "Mã QR không hợp lệ",
    };
  }

  const { sessionId, timestamp } = parsedQR;

  // Check if QR is expired
  const isExpired = isQRExpired(timestamp);

  if (isExpired) {
    return {
      success: false,
      message: "Mã QR đã hết hạn (quá 30 phút)",
    };
  }

  // Check if session exists
  // QR code contains scheduleSession.id, so we need to find scheduleAttendance by scheduleDayId
  // Use orderBy createdAt desc to get the LATEST attendance record (correct for recurring sessions)
  const attendance = await prisma.scheduleAttendance.findFirst({
    where: { 
      scheduleDayId: sessionId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      scheduleSession: {
        include: {
          schedule: {
            include: {
              registrations: true,
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    return {
      success: false,
      message: "Không tìm thấy buổi điểm danh",
    };
  }

  // Check if student is registered for this schedule
  const isRegistered = attendance.scheduleSession.schedule.registrations.some(
    (reg) => reg.studentId === studentId
  );

  if (!isRegistered) {
    return {
      success: false,
      message: "Bạn chưa đăng ký vào khóa học này",
    };
  }

  // QR expiry is already validated above via isQRExpired(timestamp).
  // If teacher generated QR, the session is active - no need for timezone-based session time check.

  // Idempotency check: already scanned?
  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: {
      scheduleAttendanceId: attendance.id,  // Use attendance.id, not sessionId
      studentId,
    },
  });

  if (existingRecord) {
    return {
      success: false,
      message: "Bạn đã điểm danh rồi",
      time: existingRecord.time,
    };
  }

  // Create attendance record
  const now = new Date();
  const time = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const newRecord = await prisma.attendanceRecord.create({
    data: {
      scheduleAttendanceId: attendance.id,  // Use attendance.id, not sessionId
      studentId,
      time,
    },
  });

  // Update total absent count (decrement), but never go below 0
  const currentAttendance = await prisma.scheduleAttendance.findUnique({
    where: { id: attendance.id },  // Use attendance.id
    select: { totalAbsent: true }
  });

  const newTotalAbsent = currentAttendance && currentAttendance.totalAbsent > 0 
    ? currentAttendance.totalAbsent - 1 
    : 0;

  await prisma.scheduleAttendance.update({
    where: { id: attendance.id },  // Use attendance.id
    data: {
      totalAbsent: newTotalAbsent,
    },
  });

  return {
    success: true,
    message: "Điểm danh thành công!",
    time,
  };
};

/**
 * Get attendance history for a session
 * Only teacher can view
 */
export const getAttendanceHistoryService = async (
  sessionId: number,
  teacherId: number
): Promise<any> => {
  const attendance = await prisma.scheduleAttendance.findUnique({
    where: { id: sessionId },
    include: {
      scheduleSession: {
        include: {
          schedule: {
            include: {
              teacher: true,
            },
          },
        },
      },
      records: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    throw new AppError("Không tìm thấy buổi điểm danh", 404);
  }

  // Check if teacher owns this schedule
  if (attendance.scheduleSession.schedule.teacherId !== teacherId) {
    throw new AppError("Bạn không có quyền xem thông tin này", 403);
  }

  return attendance;
};

/**
 * Generate all recurring session dates from schedule start to end date
 * @param startTime - Schedule start date
 * @param endTime - Schedule end date
 * @param days - Array of days to include (e.g., ["WEDNESDAY", "FRIDAY", "SUNDAY"])
 * @returns Array of dates matching the schedule days
 */
export function generateRecurringSessions(
  startTime: Date,
  endTime: Date,
  days: string[]
): Date[] {
  const daysMap: { [key: string]: number } = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
  };

  const targetDays = days.map(day => daysMap[day]).filter(day => day !== undefined);
  const sessionDates: Date[] = [];

  // Start from the first day (normalized to 00:00:00)
  let currentDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
  currentDate.setHours(0, 0, 0, 0);

  const endNormalized = new Date(endTime);
  endNormalized.setHours(0, 0, 0, 0);

  // Generate dates until we reach end date
  while (currentDate.getTime() <= endNormalized.getTime()) {
    const dayOfWeek = currentDate.getDay();

    // Check if this day is in the schedule
    if (targetDays.includes(dayOfWeek)) {
      sessionDates.push(new Date(currentDate));
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessionDates;
}

/**
 * Get all sessions with attendance data for a schedule
 * Only teacher can view
 * Reads from database (ScheduleAttendance records) instead of generating virtual dates
 */
export const getScheduleSessionsAttendanceService = async (
  scheduleId: number,
  teacherId: number
): Promise<any> => {
  // Verify teacher owns this schedule
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      teacher: true,
    },
  });

  if (!schedule) {
    throw new AppError("Không tìm thấy lịch học", 404);
  }

  if (schedule.teacherId !== teacherId) {
    throw new AppError("Bạn không có quyền xem thông tin này", 403);
  }

  // Get total registered students
  const totalRegistered = await prisma.scheduleRegistration.count({
    where: { scheduleId },
  });

  // Get all ScheduleAttendance records for this schedule from database
  const attendanceRecords = await prisma.scheduleAttendance.findMany({
    where: {
      scheduleSession: {
        scheduleId,
      },
    },
    include: {
      scheduleSession: {
        select: {
          id: true,
          day: true,
          startTime: true,
          endTime: true,
        },
      },
      records: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const now = new Date();

  // Format attendance records with status
  const formattedSessions = attendanceRecords.map((attendance) => {
    const sessionDate = new Date(attendance.date);
    // Use setUTCHours to avoid timezone offset issues when normalizing date
    sessionDate.setUTCHours(0, 0, 0, 0);

    const session = attendance.scheduleSession;
    const attendedCount = attendance.records.length;
    const absentCount = totalRegistered - attendedCount;

    // Calculate session start and end times using Vietnam timezone
    const sessionStartTime = setVietnamTime(sessionDate, session.startTime);
    const sessionEndTime = setVietnamTime(sessionDate, session.endTime);

    // Determine session status based on actual time
    let status: "ACTIVE" | "FINISHED" | "PLANNED";
    if (now.getTime() > sessionEndTime.getTime()) {
      status = "FINISHED";
    } else if (now.getTime() >= sessionStartTime.getTime()) {
      status = "ACTIVE";
    } else {
      status = "PLANNED";
    }

    return {
      id: session.id,
      attendanceId: attendance.id,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      actualDate: sessionDate.toISOString(),
      status,
      qrCode: attendance.qrCode || null,
      qrCreatedAt: attendance.createdAt || null,
      attendedCount,
      absentCount,
      totalRegistered,
      hasAttendance: true,
    };
  });

  return {
    scheduleId,
    totalRegistered,
    sessions: formattedSessions,
  };
};

/**
 * Manual check-in for a student
 * Only teacher can perform this action
 */
export const manualCheckInService = async (
  sessionId: number,
  studentId: number,
  teacherId: number,
  actualDate?: string
): Promise<{ success: boolean; message: string; time?: string }> => {
  // Check session exists and belongs to teacher
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      schedule: {
        include: {
          teacher: true,
          registrations: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError("Không tìm thấy buổi học", 404);
  }

  if (session.schedule.teacherId !== teacherId) {
    throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
  }

  // Calculate actual session date
  // Use provided actualDate if available, otherwise calculate from schedule start
  let sessionDate: Date;
  if (actualDate) {
    sessionDate = new Date(actualDate);
    // Use setUTCHours to avoid timezone offset issues when normalizing date
    sessionDate.setUTCHours(0, 0, 0, 0);
  } else {
    sessionDate = calculateSessionDate(
      session.schedule.startTime,
      session.day
    );
  }
  
  // Check if current time is within session hours
  const nowForTimeCheck = new Date();
  const sessionStartTime = setVietnamTime(sessionDate, session.startTime);
  const sessionEndTime = setVietnamTime(sessionDate, session.endTime);

  if (nowForTimeCheck.getTime() < sessionStartTime.getTime()) {
    throw new AppError("Buổi học chưa bắt đầu, không thể điểm danh", 400);
  }

  if (nowForTimeCheck.getTime() > sessionEndTime.getTime()) {
    throw new AppError("Buổi học đã kết thúc, không thể điểm danh", 400);
  }

  // Check if student is registered for this schedule
  // Convert studentId to number if it's a string
  const numericStudentId = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
  
  const isRegistered = session.schedule.registrations.some(
    (reg) => reg.studentId === numericStudentId
  );

  if (!isRegistered) {
    throw new AppError("Học sinh chưa đăng ký vào khóa học này", 400);
  }

  // Check if attendance record exists for this session date
  let attendance = await prisma.scheduleAttendance.findFirst({
    where: {
      scheduleDayId: sessionId,
      date: sessionDate,
    },
  });
  
  if (!attendance) {
    // Create attendance record if it doesn't exist
    attendance = await prisma.scheduleAttendance.create({
      data: {
        scheduleDayId: sessionId,
        date: sessionDate, // Store actual date
        qrCode: "MANUAL_" + Date.now(),
        totalAbsent: session.schedule.registrations.length,
      },
    });
  }

  // Check if student already checked in
  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: {
      scheduleAttendanceId: attendance.id,
      studentId: numericStudentId,
    },
  });

  if (existingRecord) {
    throw new AppError("Học sinh đã điểm danh rồi", 400);
  }

  // Create attendance record
  const checkInDate = new Date();
  const time = checkInDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await prisma.attendanceRecord.create({
    data: {
      scheduleAttendanceId: attendance.id,
      studentId: numericStudentId,
      time,
      createdAt: checkInDate,
    },
  });

  // Update total absent count (decrement), but never go below 0
  const currentAttendance = await prisma.scheduleAttendance.findUnique({
    where: { id: attendance.id },
    select: { totalAbsent: true }
  });

  const newTotalAbsent = currentAttendance && currentAttendance.totalAbsent > 0 
    ? currentAttendance.totalAbsent - 1 
    : 0;

  await prisma.scheduleAttendance.update({
    where: { id: attendance.id },
    data: {
      totalAbsent: newTotalAbsent,
    },
  });

  return {
    success: true,
    message: "Điểm danh thủ công thành công!",
    time,
  };
};

/**
 * Cancel a student's attendance record
 * Only allowed during active session time (within class hours)
 * @param sessionId - The pattern session ID
 * @param studentId - The student ID to cancel attendance for
 * @param teacherId - Teacher ID for authorization
 * @param actualDate - Optional date to find specific attendance record (ISO string)
 */
export const cancelAttendanceService = async (
  sessionId: number,
  studentId: number,
  teacherId: number,
  actualDate?: string
): Promise<{ success: boolean; message: string }> => {
  // Check session exists and belongs to teacher
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      schedule: {
        include: {
          teacher: true,
          registrations: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError("Không tìm thấy buổi học", 404);
  }

  if (session.schedule.teacherId !== teacherId) {
    throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
  }

  // Calculate actual session date
  let sessionDate: Date;
  if (actualDate) {
    sessionDate = new Date(actualDate);
    // Use setUTCHours to avoid timezone offset issues when normalizing date
    sessionDate.setUTCHours(0, 0, 0, 0);
  } else {
    sessionDate = calculateSessionDate(
      session.schedule.startTime,
      session.day
    );
  }

  // Check if session is still active (within class hours)
  const now = new Date();
  const sessionStartTime = setVietnamTime(sessionDate, session.startTime);
  const sessionEndTime = setVietnamTime(sessionDate, session.endTime);

  if (now.getTime() > sessionEndTime.getTime()) {
    throw new AppError("Buổi học đã kết thúc, không thể hủy điểm danh", 400);
  }

  if (now.getTime() < sessionStartTime.getTime()) {
    throw new AppError("Buổi học chưa bắt đầu, không thể hủy điểm danh", 400);
  }

  // Find attendance record for this session date
  const attendance = await prisma.scheduleAttendance.findFirst({
    where: {
      scheduleDayId: sessionId,
      date: sessionDate,
    },
  });

  if (!attendance) {
    throw new AppError("Không tìm thấy bản ghi điểm danh", 404);
  }

  // Find and delete the student's attendance record
  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: {
      scheduleAttendanceId: attendance.id,
      studentId,
    },
  });

  if (!existingRecord) {
    throw new AppError("Học sinh chưa điểm danh", 400);
  }

  // Delete the attendance record
  await prisma.attendanceRecord.delete({
    where: { id: existingRecord.id },
  });

  // Update total absent count (increment, but don't exceed total registered)
  const currentAttendance = await prisma.scheduleAttendance.findUnique({
    where: { id: attendance.id },
    select: { totalAbsent: true }
  });

  const maxAbsent = session.schedule.registrations.length;
  const newTotalAbsent = currentAttendance && currentAttendance.totalAbsent < maxAbsent
    ? currentAttendance.totalAbsent + 1
    : maxAbsent;

  await prisma.scheduleAttendance.update({
    where: { id: attendance.id },
    data: {
      totalAbsent: newTotalAbsent,
    },
  });

  return {
    success: true,
    message: "Hủy điểm danh thành công!",
  };
};

/**
 * Get student's attendance records
 * @param studentId - Student ID to fetch attendance for
 */
export const getStudentAttendanceRecordsService = async (studentId: number) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    include: {
      scheduleAttendance: {
        include: {
          scheduleSession: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    success: true,
    data: records,
  };
};

/**
 * Get student's attendance records filtered by courseId
 */
export const getStudentAttendanceByCourseIdService = async (
  studentId: number,
  courseId: number
) => {
  // Get all schedule registrations for this student that belong to schedules of this course
  const registrations = await prisma.scheduleRegistration.findMany({
    where: {
      studentId,
      schedule: {
        coursesId: courseId,
      },
    },
    select: { scheduleId: true },
  });

  const scheduleIds = registrations.map(r => r.scheduleId);

  if (scheduleIds.length === 0) {
    return { success: true, data: [] };
  }

  // Get all schedule sessions for these schedules
  const sessions = await prisma.scheduleSession.findMany({
    where: {
      scheduleId: { in: scheduleIds },
    },
    select: { id: true, day: true, startTime: true, endTime: true, scheduleId: true },
  });

  const sessionIds = sessions.map(s => s.id);

  // Get all attendance records for this student in these sessions
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      scheduleAttendance: {
        scheduleDayId: { in: sessionIds },
      },
    },
    include: {
      scheduleAttendance: {
        include: {
          scheduleSession: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              scheduleId: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Also get all schedule attendances (including ones student was absent)
  const allAttendances = await prisma.scheduleAttendance.findMany({
    where: {
      scheduleDayId: { in: sessionIds },
    },
    include: {
      scheduleSession: {
        select: {
          id: true,
          day: true,
          startTime: true,
          endTime: true,
          scheduleId: true,
        },
      },
      records: {
        where: { studentId },
        select: { id: true, time: true, createdAt: true },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const data = allAttendances.map(att => ({
    id: att.id,
    date: att.date,
    day: att.scheduleSession.day,
    startTime: att.scheduleSession.startTime,
    endTime: att.scheduleSession.endTime,
    scheduleId: att.scheduleSession.scheduleId,
    checkedIn: att.records.length > 0,
    checkInTime: att.records.length > 0 ? att.records[0].time : null,
    checkInCreatedAt: att.records.length > 0 ? att.records[0].createdAt : null,
  }));

  return { success: true, data };
};

/**
 * Get student's attendance records for parent
 * @param parentUserId - Parent user ID from JWT token
 * @param studentId - Student ID to fetch attendance for
 */
export const getStudentAttendanceRecordsForParentService = async (
  parentUserId: number,
  studentId: number
) => {
  const parent = await prisma.parentInfo.findUnique({
    where: { userId: parentUserId },
    select: { id: true },
  });

  if (!parent) {
    throw new AppError("Không tìm thấy thông tin phụ huynh", 404);
  }

  const linkedStudent = await prisma.parentStudent.findFirst({
    where: {
      parentId: parent.id,
      studentId,
    },
    select: { id: true },
  });

  if (!linkedStudent) {
    throw new AppError("Bạn không có quyền xem điểm danh của học sinh này", 403);
  }

  return getStudentAttendanceRecordsService(studentId);
};

/**
 * Get attendance history for a session with all registered students
 * Enhanced version to show all students with their attendance status
 * @param sessionId - The pattern session ID
 * @param teacherId - Teacher ID for authorization
 * @param date - Optional date to find specific attendance record (ISO string)
 */
export const getFullAttendanceHistoryService = async (
  sessionId: number,
  teacherId: number,
  date?: string
): Promise<any> => {
  // Check session exists and belongs to teacher
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    include: {
      schedule: {
        include: {
          teacher: true,
          registrations: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
      attendances: {
        include: {
          records: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new AppError("Không tìm thấy buổi học", 404);
  }

  if (session.schedule.teacherId !== teacherId) {
    throw new AppError("Bạn không có quyền xem thông tin này", 403);
  }

  // Helper to get YYYY-MM-DD in Vietnam timezone (UTC+7)
  const getVietnamDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const vietnamOffset = 7 * 60;
    const vietnamTime = new Date(d.getTime() + (vietnamOffset + d.getTimezoneOffset()) * 60000);
    return `${vietnamTime.getFullYear()}-${String(vietnamTime.getMonth() + 1).padStart(2, '0')}-${String(vietnamTime.getDate()).padStart(2, '0')}`;
  };

  // If date is provided, find the matching attendance record
  let attendance = null;
  if (date) {
    const targetDateStr = getVietnamDateString(date);

    attendance = session.attendances.find(att => {
      const attDateStr = getVietnamDateString(att.date);
      return attDateStr === targetDateStr;
    });
  } else {
    // Only use first attendance if no date provided AND attendances exist
    // If attendances exist, use the first one (most recent by default)
    if (session.attendances.length > 0) {
      attendance = session.attendances[0];
    }
  }

  const attendedStudentIds = attendance 
    ? attendance.records.map((r) => r.studentId) 
    : [];

  // Combine registered students with their attendance status
  const students = session.schedule.registrations.map((registration) => {
    const attended = attendedStudentIds.includes(registration.studentId);
    const record = attendance?.records.find(
      (r) => r.studentId === registration.studentId
    );

    return {
      studentId: registration.studentId,
      student: registration.student,
      attended,
      checkInTime: record?.time || null,
    };
  });

  return {
    sessionId: session.id,
    day: session.day,
    startTime: session.startTime,
    endTime: session.endTime,
    date: attendance?.date || session.createdAt,
    qrCode: attendance?.qrCode || null,
    qrCreatedAt: attendance?.createdAt || null,
    totalRegistered: session.schedule.registrations.length,
    attendedCount: attendedStudentIds.length,
    absentCount: attendance?.totalAbsent ?? session.schedule.registrations.length,
    students,
  };
};
