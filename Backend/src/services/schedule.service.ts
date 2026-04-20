import { CreateScheduleRequest } from "../DTOS/Schedule/create-schedule.request";
import { UpdateScheduleRequest } from "../DTOS/Schedule/update-schedule.request";
import {
  SchedulePagingResponse,
  ScheduleResponse,
} from "../DTOS/Schedule/schedule.response";
import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { toScheduleResponse } from "../utils/Mapper/schedule.mapper";
import { Prisma } from "@prisma/client";
import { generateRecurringSessions } from "./attendance.service";

// Tạo schedule mới
export const createScheduleService = async (
  data: CreateScheduleRequest,
): Promise<ScheduleResponse> => {
  const courseId = Number(data.coursesId);
  const teacherId = Number(data.teacherId);
  const classroomId = Number(data.classroomId);

  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (end <= start) {
    throw new AppError("Thời gian kết thúc phải sau thời gian bắt đầu", 400);
  }

  // Check course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError("Khóa học không tồn tại", 404);
  }

  if (course.status !== "ACTIVE") {
    throw new AppError(
      `Không thể tạo lịch cho khóa học ở trạng thái ${course.status}`,
      400,
    );
  }

  // Check teacher
  const teacher = await prisma.teacherInfo.findUnique({
    where: { id: teacherId },
    include: { freeDays: true },
  });

  if (!teacher) {
    throw new AppError("Giáo viên không tồn tại", 404);
  }

  const teacherFreeDaySet = new Set(teacher.freeDays.map((d) => d.day));

  //Check classroom
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });

  if (!classroom) {
    throw new AppError("Phòng học không tồn tại", 404);
  }

  // Tổng sĩ số lấy từ sức chứa phòng học
  const totalSlot = classroom.maxSize;

  // Validate sessions
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  for (const session of data.sessions) {
    // Chỉ kiểm tra nếu giáo viên đã đăng ký lịch rảnh
    if (teacherFreeDaySet.size > 0 && !teacherFreeDaySet.has(session.day)) {
      const freeDaysList = [...teacherFreeDaySet].join(", ");
      throw new AppError(
        `Giáo viên không rảnh vào ${session.day}. Ngày rảnh của giáo viên: ${freeDaysList}`,
        400,
      );
    }

    if (toMinutes(session.endTime) <= toMinutes(session.startTime)) {
      throw new AppError(
        `Giờ kết thúc phải sau giờ bắt đầu (${session.day})`,
        400,
      );
    }
  }

  const days = [...new Set(data.sessions.map((s) => s.day))];

  const conflictChecks = data.sessions.map(async (session) => {
    const conflict = await prisma.scheduleSession.findFirst({
      where: {
        day: session.day,
        // Kiểm tra overlap thời gian
        startTime: { lt: session.endTime },
        endTime: { gt: session.startTime },
        schedule: {
          AND: [
            // Chỉ check trong khoảng thời gian hiệu lực của khóa học
            {
              startTime: { lte: end },
              endTime: { gte: start },
            },
            // Check trùng giáo viên HOẶC phòng học
            {
              OR: [{ teacherId }, { classroomId }],
            },
          ],
        },
      },
      include: {
        schedule: true,
      },
    });
    return { session, conflict };
  });

  const results = await Promise.all(conflictChecks);

  for (const { session, conflict } of results) {
    if (conflict) {
      const target = conflict.schedule.teacherId === teacherId ? "Giáo viên" : "Phòng học";
      throw new AppError(
        `${target} đã bị trùng lịch vào ${session.day} (${session.startTime} - ${session.endTime})`,
        400
      );
    }
  }

  // Transaction create
  const schedule = await prisma.$transaction(async (tx) => {
    return tx.schedule.create({
      data: {
        teacherId,
        classroomId,
        coursesId: courseId,
        totalSlot,
        totalRegister: 0,
        startTime: start,
        endTime: end,
        sessions: {
          create: data.sessions.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        },
      },
      include: {
        course: true,
        sessions: true,
        classroom: true,
        teacher: {
          include: {
            user: true,
            freeDays: true,
          },
        },
      },
    });
  });

  // Auto-generate ScheduleAttendance records for all session dates
  try {
    const sessionDays = schedule.sessions.map((s) => s.day);

    const allDates = generateRecurringSessions(start, end, sessionDays);

    // Limit to course.totalSession if set (> 0)
    const maxSessions = course.totalSession > 0 ? course.totalSession : allDates.length;
    const limitedDates = allDates.slice(0, maxSessions);

    // Map day name to session for quick lookup
    const dayMap: { [key: number]: string } = {
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
      0: "SUNDAY",
    };

    // Create attendance records for each date
    const attendanceData = limitedDates.map((date) => {
      const dayName = dayMap[date.getDay()];
      const matchingSession = schedule.sessions.find((s) => s.day === dayName);
      if (!matchingSession) return null;
      return {
        scheduleDayId: matchingSession.id,
        date,
        qrCode: "",
        totalAbsent: 0,
      };
    }).filter((d): d is NonNullable<typeof d> => d !== null);

    if (attendanceData.length > 0) {
      await prisma.scheduleAttendance.createMany({
        data: attendanceData,
      });
    }

    console.log(`[SCHEDULE] Auto-generated ${attendanceData.length} attendance records for schedule ${schedule.id}`);
  } catch (error) {
    console.error("[SCHEDULE] Failed to auto-generate attendance records:", error);
    // Don't fail schedule creation if attendance generation fails
  }

  return toScheduleResponse(schedule);
};

// Lấy 3 Schedule gần từ tính từ ngày mai
export const getUpcomingSchedulesService = async (): Promise<
  ScheduleResponse[]
> => {
  const now = new Date();

  const schedules = await prisma.schedule.findMany({
    where: {
      startTime: {
        gte: now,
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: 3,
    include: {
      course: true,
      sessions: true,
      classroom: true,
      teacher: {
        include: {
          user: true,
          freeDays: true,
        },
      },
    },
  });

  return schedules.map(toScheduleResponse);
};

// Lấy tất cả Schedule chưa bắt đầu (startTime > hiện tại) + phân trang
// Nếu có courseId thì lấy tất cả schedule của course đó
export const getActiveSchedulesByCourseIdService = async ({
  page = 1,
  limit = 10,
  courseId,
}: {
  page?: number;
  limit?: number;
  courseId?: number;
}): Promise<SchedulePagingResponse> => {
  const now = new Date();
  const skip = (page - 1) * limit;

  // Luôn lọc schedule chưa bắt đầu theo thời gian, courseId chỉ là điều kiện bổ sung.
  const where: Prisma.ScheduleWhereInput = {
    startTime: { gt: now },
    ...(courseId !== undefined ? { coursesId: courseId } : {}),
  };

  const totalItems = await prisma.schedule.count({
    where,
  });

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: { startTime: "asc" },
    skip,
    take: limit,
    include: {
      course: true,
      sessions: true,
      classroom: true,
      teacher: {
        include: {
          user: true,
          freeDays: true,
        },
      },
    },
  });

  return {
    data: schedules.map(toScheduleResponse),
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
};

// Lấy tất cả Schedule
export const getAllSchedulesService = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}): Promise<SchedulePagingResponse> => {
  const skip = (page - 1) * limit;

  const totalItems = await prisma.schedule.count();

  const schedules = await prisma.schedule.findMany({
    orderBy: { startTime: "asc" },
    skip,
    take: limit,
    include: {
      course: true,
      sessions: true,
      classroom: true,
      teacher: {
        include: {
          user: true,
          freeDays: true,
        },
      },
    },
  });

  return {
    data: schedules.map(toScheduleResponse),
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
};

// Tìm kiếm nâng cao theo tên khóa học + ngày bắt đầu
export const searchSchedulesAdvancedService = async ({
  page = 1,
  limit = 10,
  courseName,
  startDate,
}: {
  page?: number;
  limit?: number;
  courseName?: string;
  startDate?: string;
}): Promise<SchedulePagingResponse> => {
  const skip = (page - 1) * limit;

  let startOfDay: Date | undefined;
  let endOfDay: Date | undefined;

  if (startDate) {
    const parsedDate = new Date(startDate);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError("Ngày bắt đầu không hợp lệ", 400);
    }

    startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);
  }

  const where: Prisma.ScheduleWhereInput = {
    ...(courseName
      ? {
          course: {
            name: {
              contains: courseName.trim(),
            },
          },
        }
      : {}),
    ...(startOfDay && endOfDay
      ? {
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        }
      : {}),
  };

  const [totalItems, schedules] = await prisma.$transaction([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where,
      orderBy: { startTime: "asc" },
      skip,
      take: limit,
      include: {
        course: true,
        sessions: true,
        classroom: true,
        teacher: {
          include: {
            user: true,
            freeDays: true,
          },
        },
      },
    }),
  ]);

  return {
    data: schedules.map(toScheduleResponse),
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
};

// Lấy chi tiết Schedule theo ID
export const getScheduleByIdService = async (
  id: number
): Promise<ScheduleResponse> => {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      course: true,
      sessions: {
        orderBy: { startTime: "asc" },
      },
      classroom: true,
      teacher: {
        include: {
          user: true,
          freeDays: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new Error("Không tìm thấy đợt mở lớp");
  }

  return toScheduleResponse(schedule);
};

// Cập nhật schedule (chỉ khi chưa có học sinh đăng ký)
export const updateScheduleService = async (
  id: number,
  data: UpdateScheduleRequest,
): Promise<ScheduleResponse> => {
  const existingSchedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      sessions: true,
    },
  });

  if (!existingSchedule) {
    throw new AppError("Không tìm thấy đợt mở lớp", 404);
  }

  const registrationCount = await prisma.scheduleRegistration.count({
    where: { scheduleId: id },
  });

  if (registrationCount > 0) {
    throw new AppError(
      "Không thể cập nhật lịch học vì đã có học sinh đăng ký",
      400,
    );
  }

  const courseId = existingSchedule.coursesId;
  const teacherId =
    data.teacherId !== undefined ? Number(data.teacherId) : existingSchedule.teacherId;
  const classroomId =
    data.classroomId !== undefined
      ? Number(data.classroomId)
      : existingSchedule.classroomId;

  const start = data.startTime
    ? new Date(data.startTime)
    : new Date(existingSchedule.startTime);
  const end = data.endTime
    ? new Date(data.endTime)
    : new Date(existingSchedule.endTime);

  const sessionsToUse =
    data.sessions ??
    existingSchedule.sessions.map((session) => ({
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
    }));

  if (end <= start) {
    throw new AppError("Thời gian kết thúc phải sau thời gian bắt đầu", 400);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError("Khóa học không tồn tại", 404);
  }

  if (course.status !== "ACTIVE") {
    throw new AppError(
      `Không thể tạo lịch cho khóa học ở trạng thái ${course.status}`,
      400,
    );
  }

  const teacher = await prisma.teacherInfo.findUnique({
    where: { id: teacherId },
    include: { freeDays: true },
  });

  if (!teacher) {
    throw new AppError("Giáo viên không tồn tại", 404);
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });

  if (!classroom) {
    throw new AppError("Phòng học không tồn tại", 404);
  }

  const teacherFreeDaySet = new Set(teacher.freeDays.map((d) => d.day));

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  for (const session of sessionsToUse) {
    if (teacherFreeDaySet.size > 0 && !teacherFreeDaySet.has(session.day)) {
      const freeDaysList = [...teacherFreeDaySet].join(", ");
      throw new AppError(
        `Giáo viên không rảnh vào ${session.day}. Ngày rảnh của giáo viên: ${freeDaysList}`,
        400,
      );
    }

    if (toMinutes(session.endTime) <= toMinutes(session.startTime)) {
      throw new AppError(
        `Giờ kết thúc phải sau giờ bắt đầu (${session.day})`,
        400,
      );
    }
  }

  const days = [...new Set(sessionsToUse.map((s) => s.day))];

  const conflictSessions = await prisma.scheduleSession.findMany({
    where: {
      day: { in: days },
      schedule: {
        AND: [
          {
            id: { not: id },
          },
          {
            startTime: { lte: end },
            endTime: { gte: start },
          },
          {
            OR: [{ teacherId }, { classroomId }],
          },
        ],
      },
    },
    include: {
      schedule: {
        select: {
          teacherId: true,
          classroomId: true,
        },
      },
    },
  });

  for (const session of sessionsToUse) {
    for (const conflict of conflictSessions) {
      if (conflict.day !== session.day) continue;

      const isOverlap =
        toMinutes(conflict.startTime) < toMinutes(session.endTime) &&
        toMinutes(conflict.endTime) > toMinutes(session.startTime);

      if (!isOverlap) continue;

      if (conflict.schedule.teacherId === teacherId) {
        throw new AppError(
          `Giáo viên bị trùng lịch vào ${session.day} (${session.startTime} - ${session.endTime})`,
          400,
        );
      }

      if (conflict.schedule.classroomId === classroomId) {
        throw new AppError(
          `Phòng học bị trùng lịch vào ${session.day} (${session.startTime} - ${session.endTime})`,
          400,
        );
      }
    }
  }

  const updatedSchedule = await prisma.$transaction(async (tx) => {
    // Delete old attendance records and sessions if sessions are being updated
    if (data.sessions) {
      // Get existing session IDs to delete their attendance records
      const existingSessions = await tx.scheduleSession.findMany({
        where: { scheduleId: id },
        select: { id: true },
      });
      const existingSessionIds = existingSessions.map((s) => s.id);

      // Delete attendance records linked to old sessions
      if (existingSessionIds.length > 0) {
        await tx.scheduleAttendance.deleteMany({
          where: { scheduleDayId: { in: existingSessionIds } },
        });
      }

      await tx.scheduleSession.deleteMany({
        where: { scheduleId: id },
      });
    }

    return tx.schedule.update({
      where: { id },
      data: {
        teacherId,
        classroomId,
        coursesId: courseId,
        totalSlot: classroom.maxSize,
        startTime: start,
        endTime: end,
        ...(data.sessions
          ? {
              sessions: {
                create: data.sessions.map((s) => ({
                  day: s.day,
                  startTime: s.startTime,
                  endTime: s.endTime,
                })),
              },
            }
          : {}),
      },
      include: {
        course: true,
        sessions: true,
        classroom: true,
        teacher: {
          include: {
            user: true,
            freeDays: true,
          },
        },
      },
    });
  });

  // Auto-regenerate ScheduleAttendance records for updated schedule
  if (data.sessions) {
    try {
      const sessionDays = updatedSchedule.sessions.map((s) => s.day);
      const allDates = generateRecurringSessions(start, end, sessionDays);

      const maxSessions = course.totalSession > 0 ? course.totalSession : allDates.length;
      const limitedDates = allDates.slice(0, maxSessions);

      const dayMap: { [key: number]: string } = {
        1: "MONDAY",
        2: "TUESDAY",
        3: "WEDNESDAY",
        4: "THURSDAY",
        5: "FRIDAY",
        6: "SATURDAY",
        0: "SUNDAY",
      };

      const attendanceData = limitedDates.map((date) => {
        const dayName = dayMap[date.getDay()];
        const matchingSession = updatedSchedule.sessions.find((s) => s.day === dayName);
        if (!matchingSession) return null;
        return {
          scheduleDayId: matchingSession.id,
          date,
          qrCode: "",
          totalAbsent: 0,
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null);

      if (attendanceData.length > 0) {
        await prisma.scheduleAttendance.createMany({
          data: attendanceData,
        });
      }

      console.log(`[SCHEDULE] Auto-regenerated ${attendanceData.length} attendance records for updated schedule ${updatedSchedule.id}`);
    } catch (error) {
      console.error("[SCHEDULE] Failed to auto-regenerate attendance records:", error);
    }
  }

  return toScheduleResponse(updatedSchedule);
};

// Xóa schedule (chỉ khi chưa có học sinh đăng ký)
export const deleteScheduleService = async (id: number): Promise<void> => {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new AppError("Không tìm thấy đợt mở lớp", 404);
  }

  const registrationCount = await prisma.scheduleRegistration.count({
    where: { scheduleId: id },
  });

  if (registrationCount > 0) {
    throw new AppError("Không thể xóa lịch học vì đã có học sinh đăng ký", 400);
  }

  await prisma.schedule.delete({
    where: { id },
  });
};

