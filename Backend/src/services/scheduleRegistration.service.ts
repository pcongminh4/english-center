import prisma from "../config/database";
import { RegisterScheduleRequest } from "../DTOS/Schedule/register-schedule.request";
import { RegisterScheduleResponse } from "../DTOS/Schedule/register-schedule.response";
import { GetStudentSchedulesRequest } from "../DTOS/Schedule/get-student-schedules.request";
import { SchedulePagingResponse } from "../DTOS/Schedule/schedule.response";
import { StudentResponse } from "../DTOS/Student/student.response";
import { toStudentResponse } from "../utils/Mapper/student.mapper";
import { toScheduleResponse } from "../utils/Mapper/schedule.mapper";
import { AppError } from "../middleware/errorHandler";
import { buildCourseThumbnailUrl } from "../utils/fileUrl";

const toMinutes = (time: string): number => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const isDateRangeOverlapped = (
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean => aStart < bEnd && bStart < aEnd;

const hasSessionOverlap = (
  sourceSessions: Array<{ day: string; startTime: string; endTime: string }>,
  targetSessions: Array<{ day: string; startTime: string; endTime: string }>,
): boolean => {
  for (const source of sourceSessions) {
    for (const target of targetSessions) {
      if (source.day !== target.day) continue;

      const overlapped =
        toMinutes(source.startTime) < toMinutes(target.endTime) &&
        toMinutes(source.endTime) > toMinutes(target.startTime);

      if (overlapped) return true;
    }
  }

  return false;
};

const hasScheduleConflict = (
  candidateSchedule: {
    startTime: Date;
    endTime: Date;
    sessions: Array<{ day: string; startTime: string; endTime: string }>;
  },
  existingSchedule: {
    startTime: Date;
    endTime: Date;
    sessions: Array<{ day: string; startTime: string; endTime: string }>;
  },
): boolean => {
  if (
    !isDateRangeOverlapped(
      candidateSchedule.startTime,
      candidateSchedule.endTime,
      existingSchedule.startTime,
      existingSchedule.endTime,
    )
  ) {
    return false;
  }

  return hasSessionOverlap(candidateSchedule.sessions, existingSchedule.sessions);
};

// Đăng ký Schedule dành cho Student
export const registerScheduleService = async (
  data: RegisterScheduleRequest,
): Promise<RegisterScheduleResponse> => {
  const { scheduleId, studentId } = data;

  // Kiểm tra schedule có tồn tại
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          courseSkill: true,
        },
      },
      sessions: {
        select: {
          day: true,
          startTime: true,
          endTime: true,
        },
      },
      _count: {
        select: {
          registrations: true,
          seatReservations: {
            where: {
              status: "ACTIVE",
              expiresAt: { gt: new Date() },
            },
          },
        },
      },
    },
  });
  if (!schedule) throw new AppError("Schedule không tồn tại", 404);

  const occupiedSeats = schedule._count.registrations + schedule._count.seatReservations;
  if (occupiedSeats >= schedule.totalSlot) {
    throw new AppError("Lịch học đã đủ sĩ số", 400);
  }

  // Kiểm tra hs có tồn tại
  const student = await prisma.studentInfo.findUnique({
    where: { id: Number(studentId) },
    include: {
      scheduleRegistrations: {
        include: {
          schedule: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                },
              },
              sessions: {
                select: {
                  day: true,
                  startTime: true,
                  endTime: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!student) throw new AppError("Student không tồn tại", 404);

  // Kiểm tra đã đăng ký chưa (unique constraint)
  const existing = await prisma.scheduleRegistration.findUnique({
    where: { scheduleId_studentId: { scheduleId, studentId: Number(studentId) } },
  });
  if (existing) throw new AppError("Student đã đăng ký lịch này", 400);

  // Kiểm tra trùng lịch với các khóa học đã đăng ký
  for (const registration of student.scheduleRegistrations) {
    const conflict = hasScheduleConflict(
      {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        sessions: schedule.sessions,
      },
      {
        startTime: registration.schedule.startTime,
        endTime: registration.schedule.endTime,
        sessions: registration.schedule.sessions,
      },
    );

    if (conflict) {
      throw new AppError(
        `Học sinh bị trùng lịch với khóa "${registration.schedule.course.name}"`,
        400,
      );
    }
  }

  // Transaction: tạo schedule registration + tăng totalRegister
  const registration = await prisma.$transaction(async (tx) => {
    const reg = await tx.scheduleRegistration.create({
      data: {
        scheduleId,
        studentId: Number(studentId),
      },
    });

    // Tăng totalRegister
    await tx.schedule.update({
      where: { id: scheduleId },
      data: { totalRegister: { increment: 1 } },
    });

    return reg;
  });

  return {
    scheduleId: registration.scheduleId,
    studentId: registration.studentId,
    createdAt: registration.createdAt,
  };
};

// Admin: Lấy danh sách học sinh đã đăng ký trong một schedule
export const getScheduleStudentsService = async (
  scheduleId: number,
  { search, page = 1, limit = 10 }: { search?: string; page?: number; limit?: number },
): Promise<{ data: StudentResponse[]; totalItems: number; totalPages: number; page: number; limit: number }> => {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new AppError("Schedule không tồn tại", 404);

  const where: any = {
    scheduleId,
    student: {
      deletedAt: null,
      user: { deletedAt: null },
    },
  };

  if (search) {
    where.student = {
      ...where.student,
      user: {
        ...where.student.user,
        OR: [
          { fullname: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      },
    };
  }

  const totalItems = await prisma.scheduleRegistration.count({ where });

  const registrations = await prisma.scheduleRegistration.findMany({
    where,
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  return {
    data: registrations.map((r) => toStudentResponse(r.student)),
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    page,
    limit,
  };
};

// Student: Lấy tất cả schedules đã đăng ký theo courseId
export const getStudentScheduleByCourseIdService = async (
  studentId: number,
  courseId: number,
): Promise<any[]> => {
  const where: any = {
    studentId,
    student: { deletedAt: null },
    schedule: {
      coursesId: courseId,
    },
  };

  const registrations = await prisma.scheduleRegistration.findMany({
    where,
    include: {
      schedule: {
        include: {
          teacher: { include: { user: true } },
          course: true,
          classroom: true,
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return registrations.map((registration) => ({
    id: registration.schedule.id,
    teacher: {
      id: registration.schedule.teacher.id,
      fullname: registration.schedule.teacher.user.fullname,
    },
    classroom: {
      id: registration.schedule.classroom.id,
      name: registration.schedule.classroom.name,
    },
    course: {
      id: registration.schedule.course.id,
      name: registration.schedule.course.name,
      type: registration.schedule.course.type,
      skill: registration.schedule.course.courseSkill,
      thumbnail: buildCourseThumbnailUrl(registration.schedule.course.thumbnail),
    },
    totalSlot: registration.schedule.totalSlot,
    totalRegister: registration.schedule.totalRegister,
    startTime: registration.schedule.startTime,
    endTime: registration.schedule.endTime,
    createdAt: registration.schedule.createdAt,
    updatedAt: registration.schedule.updatedAt,
    sessions: registration.schedule.sessions.map(session => ({
      id: session.id,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
    })),
  }));
};

// Student: Lấy danh sách schedules mà student đã đăng ký
export const getStudentSchedulesService = async (
  studentId: number,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
): Promise<{ data: any[]; totalItems: number; totalPages: number; page: number; limit: number }> => {
  const where: any = {
    studentId,
    student: { deletedAt: null },
  };

  const totalItems = await prisma.scheduleRegistration.count({ where });

  const registrations = await prisma.scheduleRegistration.findMany({
    where,
    include: {
      schedule: {
        include: {
          teacher: { include: { user: true } },
          course: true,
          classroom: true,
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const data = registrations.map((r) => ({
    id: r.schedule.id,
    teacher: {
      id: r.schedule.teacher.id,
      fullname: r.schedule.teacher.user.fullname,
    },
    classroom: {
      id: r.schedule.classroom.id,
      name: r.schedule.classroom.name,
    },
    course: {
      id: r.schedule.course.id,
      name: r.schedule.course.name,
      type: r.schedule.course.type,
      skill: r.schedule.course.courseSkill,
      thumbnail: buildCourseThumbnailUrl(r.schedule.course.thumbnail),
    },
    totalSlot: r.schedule.totalSlot,
    totalRegister: r.schedule.totalRegister,
    startTime: r.schedule.startTime,
    endTime: r.schedule.endTime,
    createdAt: r.schedule.createdAt,
    updatedAt: r.schedule.updatedAt,
    sessions: r.schedule.sessions.map(session => ({
      id: session.id,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
    })),
  }));

  return {
    data,
    totalItems: data.length,
    totalPages: Math.ceil(data.length / limit),
    page,
    limit,
  };
};

// Lấy tất cả schedules của student dựa vào ScheduleRegistration
export const getAllSchedulesByStudentIdService = async (
  req: GetStudentSchedulesRequest,
): Promise<SchedulePagingResponse> => {
  const { studentId, page = 1, limit = 10 } = req;

  const student = await prisma.studentInfo.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new AppError("Student không tồn tại", 404);
  }

  const where = {
    studentId,
    student: { deletedAt: null },
  };

  const totalItems = await prisma.scheduleRegistration.count({ where });

  const registrations = await prisma.scheduleRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      schedule: {
        include: {
          teacher: {
            include: {
              user: true,
              freeDays: true,
            },
          },
          course: true,
          classroom: true,
          sessions: true,
        },
      },
    },
  });

  return {
    data: registrations.map((registration) =>
      toScheduleResponse(registration.schedule),
    ),
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
};

// Admin: Xóa học sinh khỏi schedule
export const removeStudentFromScheduleService = async (
  scheduleId: number,
  studentId: number,
): Promise<void> => {
  const registration = await prisma.scheduleRegistration.findUnique({
    where: { scheduleId_studentId: { scheduleId, studentId } },
  });
  if (!registration) throw new AppError("Học sinh chưa đăng ký lịch học này", 404);

  await prisma.$transaction(async (tx) => {
    await tx.scheduleRegistration.delete({
      where: { scheduleId_studentId: { scheduleId, studentId } },
    });
    await tx.schedule.update({
      where: { id: scheduleId },
      data: { totalRegister: { decrement: 1 } },
    });
  });
};

// Admin: Lấy danh sách học sinh hợp lệ để thêm vào một schedule
export const getEligibleStudentsForScheduleService = async (
  scheduleId: number,
  {
    search,
    page = 1,
    limit = 10,
  }: { search?: string; page?: number; limit?: number },
): Promise<{ data: StudentResponse[]; totalItems: number; totalPages: number; page: number; limit: number }> => {
  const targetSchedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      sessions: {
        select: {
          day: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!targetSchedule) {
    throw new AppError("Schedule không tồn tại", 404);
  }

  const students = await prisma.studentInfo.findMany({
    where: {
      deletedAt: null,
      user: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { fullname: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
    },
    include: {
      user: true,
      scheduleRegistrations: {
        include: {
          schedule: {
            include: {
              sessions: {
                select: {
                  day: true,
                  startTime: true,
                  endTime: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const eligibleStudents = students.filter((student) => {
    if (
      student.scheduleRegistrations.some(
        (registration) => registration.scheduleId === scheduleId,
      )
    ) {
      return false;
    }

    for (const registration of student.scheduleRegistrations) {
      const conflict = hasScheduleConflict(
        {
          startTime: targetSchedule.startTime,
          endTime: targetSchedule.endTime,
          sessions: targetSchedule.sessions,
        },
        {
          startTime: registration.schedule.startTime,
          endTime: registration.schedule.endTime,
          sessions: registration.schedule.sessions,
        },
      );

      if (conflict) {
        return false;
      }
    }

    return true;
  });

  const totalItems = eligibleStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;
  const pageData = eligibleStudents.slice(start, start + limit);

  return {
    data: pageData.map((student) => toStudentResponse(student)),
    totalItems,
    totalPages,
    page: safePage,
    limit,
  };
};