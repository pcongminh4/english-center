import bcrypt from "bcryptjs";

import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { StudentResponse } from "../DTOS/Student/student.response";
import { toStudentResponse } from "../utils/Mapper/student.mapper";
import { toCourseResponse } from "../utils/Mapper/course.mapper";
import { buildCourseThumbnailUrl } from "../utils/fileUrl";
import { PagingData } from "../DTOS/pagination";
import { CreateStudentRequest, GetStudentRequest, UpdateStudentRequest } from "../DTOS/Student";

// Tạo học sinh mới
export const createStudentService = async (
  data: CreateStudentRequest,
): Promise<StudentResponse> => {
  // Kiểm tra email và phone đã tồn tại
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  const existingPhone = await prisma.user.findUnique({
    where: { phone: data.phone },
  });

  if (existingEmail) {
    throw new AppError("Email đã tồn tại", 400);
  }
  if (existingPhone) {
    throw new AppError("Số điện thoại đã tồn tại", 400);
  }

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Tạo user và student info trong một transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullname: data.fullname,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: "STUDENT",
        },
      });

      const studentInfo = await tx.studentInfo.create({
        data: {
          userId: user.id,
          dob: data.dob ? new Date(data.dob) : undefined,
          cccd: data.cccd,
          scoreRl: data.scoreRl !== undefined ? Number(data.scoreRl) : 0,
          scoreSw: data.scoreSw !== undefined ? Number(data.scoreSw) : 0,
        },
        include: {
          user: true,
        },
      });

      return studentInfo;
    });

    return toStudentResponse(result);
  } catch (error) {
    throw new AppError(
      "Lỗi khi tạo học sinh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách học sinh với filters
export const getAllStudentsService = async (
  req: GetStudentRequest,
): Promise<PagingData<StudentResponse>> => {
  try {
    // Build where clause
    const where: any = {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    };

    // Filter by score range
    if (req.minScoreRl !== undefined || req.maxScoreRl !== undefined) {
      where.scoreRl = {};
      if (req.minScoreRl !== undefined) where.scoreRl.gte = req.minScoreRl;
      if (req.maxScoreRl !== undefined) where.scoreRl.lte = req.maxScoreRl;
    }

    if (req.minScoreSw !== undefined || req.maxScoreSw !== undefined) {
      where.scoreSw = {};
      if (req.minScoreSw !== undefined) where.scoreSw.gte = req.minScoreSw;
      if (req.maxScoreSw !== undefined) where.scoreSw.lte = req.maxScoreSw;
    }

    // Search trong fullname, email, phone
    if (req.search) {
      where.user = {
        ...where.user,
        OR: [
          { fullname: { contains: req.search } },
          { email: { contains: req.search } },
          { phone: { contains: req.search } },
        ],
      };
    }

    // Đếm tổng số students
    const totalItems = await prisma.studentInfo.count({ where });

    // Lấy danh sách students
    const students = await prisma.studentInfo.findMany({
      where,
      include: {
        user: true,
      },
      take: req.limit,
      skip: req.page && req.limit ? (req.page - 1) * req.limit : undefined,
      orderBy: req.sortBy
        ? {
            [req.sortBy]: req.sortOrder || "asc",
          }
        : { createdAt: "desc" },
    });

    return {
      data: students.map(toStudentResponse),
      page: req.page || 1,
      limit: req.limit || students.length,
      totalPages: req.limit ? Math.ceil(totalItems / req.limit) : 1,
      totalItems,
    };
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy danh sách học sinh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy học sinh theo ID
export const getStudentByIdService = async (
  id: number,
): Promise<StudentResponse> => {
  try {
    const student = await prisma.studentInfo.findFirst({
      where: {
        id,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
      },
    });

    if (!student) {
      throw new AppError("Không tìm thấy học sinh", 404);
    }

    return toStudentResponse(student);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin học sinh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy học sinh theo userId (dùng cho endpoint /me)
export const getStudentByUserIdService = async (
  userId: number,
): Promise<StudentResponse> => {
  try {
    const student = await prisma.studentInfo.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
      },
    });

    if (!student) {
      throw new AppError("Không tìm thấy học sinh", 404);
    }

    return toStudentResponse(student);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin học sinh: " + (error as Error).message,
      500,
    );
  }
};

// Cập nhật học sinh
export const updateStudentService = async (
  id: number,
  data: UpdateStudentRequest,
): Promise<StudentResponse> => {
  // Kiểm tra học sinh tồn tại
  const student = await prisma.studentInfo.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!student) {
    throw new AppError("Không tìm thấy học sinh", 404);
  }

  // Kiểm tra email và phone nếu có thay đổi
  if (data.email && data.email !== student.user.email) {
    // Chỉ check database khi email thực sự thay đổi
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail && existingEmail.email !== student.user.email) {
      throw new AppError("Email đã tồn tại", 400);
    }
  }

  if (data.phone && data.phone !== student.user.phone) {
    // Chỉ check database khi phone thực sự thay đổi
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone && existingPhone.phone !== student.user.phone) {
      throw new AppError("Số điện thoại đã tồn tại", 400);
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật user info nếu có
      if (data.fullname || data.email || data.phone) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(data.fullname && { fullname: data.fullname }),
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
          },
        });
      }

      // Cập nhật student info
      const updatedStudent = await tx.studentInfo.update({
        where: { id },
        data: {
          ...(data.dob !== undefined && { dob: new Date(data.dob) }),
          ...(data.cccd !== undefined && { cccd: data.cccd }),
          ...(data.scoreRl !== undefined && { scoreRl: Number(data.scoreRl) }),
          ...(data.scoreSw !== undefined && { scoreSw: Number(data.scoreSw) }),
        },
        include: {
          user: true,
        },
      });

      return updatedStudent;
    });

    return toStudentResponse(result);
  } catch (error) {
    throw new AppError(
      "Lỗi khi cập nhật học sinh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy thông tin phụ huynh của học sinh
export const getStudentParentsService = async (
  studentId: number,
): Promise<any[]> => {
  try {
    const parents = await prisma.parentStudent.findMany({
      where: {
        studentId,
        student: { deletedAt: null },
      },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    return parents.map((p) => ({
      id: p.parent.id,
      fullname: p.parent.user.fullname,
      email: p.parent.user.email,
      phone: p.parent.user.phone,
    }));
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy thông tin phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách khóa học đã đăng ký của học sinh
export const getStudentCoursesService = async (
  studentId: number,
): Promise<any[]> => {
  try {
    // Get courses from StudentRegisterCourse (direct enrollment)
    const directRegistrations = await prisma.studentRegisterCourse.findMany({
      where: {
        studentId,
        student: { deletedAt: null },
      },
      include: {
        course: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get courses from ScheduleRegistration → Schedule → Course
    const scheduleRegistrations = await prisma.scheduleRegistration.findMany({
      where: {
        studentId,
        student: { deletedAt: null },
      },
      include: {
        schedule: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Merge and deduplicate by course ID
    const courseMap = new Map<number, any>();

    for (const r of directRegistrations) {
      if (!courseMap.has(r.course.id)) {
        courseMap.set(r.course.id, {
          id: r.course.id,
          name: r.course.name,
          type: r.course.type,
          courseSkill: r.course.courseSkill,
          status: r.course.status,
          price: r.course.price,
          sale: r.course.sale,
          thumbnail: buildCourseThumbnailUrl(r.course.thumbnail),
          totalSession: r.course.totalSession,
          minBand: r.course.minBand,
          maxBand: r.course.maxBand,
          createdAt: r.course.createdAt,
          updatedAt: r.course.updatedAt,
        });
      }
    }

    for (const r of scheduleRegistrations) {
      const course = r.schedule.course;
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, {
          id: course.id,
          name: course.name,
          type: course.type,
          courseSkill: course.courseSkill,
          status: course.status,
          price: course.price,
          sale: course.sale,
          thumbnail: buildCourseThumbnailUrl(course.thumbnail),
          totalSession: course.totalSession,
          minBand: course.minBand,
          maxBand: course.maxBand,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        });
      }
    }

    return Array.from(courseMap.values());
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy danh sách khóa học: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách học sinh theo phụ huynh (từ userId trong JWT)
export const getStudentsByParentUserIdService = async (
  userId: number,
): Promise<Array<StudentResponse & { schedules: any[] }>> => {
  try {
    const parent = await prisma.parentInfo.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!parent) {
      throw new AppError("Không tìm thấy phụ huynh", 404);
    }

    const parentStudents = await prisma.parentStudent.findMany({
      where: {
        parentId: parent.id,
        student: {
          deletedAt: null,
          user: {
            deletedAt: null,
          },
        },
      },
      include: {
        student: {
          include: {
            user: true,
            scheduleRegistrations: {
              include: {
                schedule: {
                  include: {
                    teacher: {
                      include: {
                        user: true,
                      },
                    },
                    classroom: true,
                    course: true,
                    sessions: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return parentStudents.map((parentStudent) => {
      const student = parentStudent.student;
      return {
        ...toStudentResponse(student),
        schedules: student.scheduleRegistrations.map((registration) => ({
          registrationId: registration.id,
          registrationCreatedAt: registration.createdAt,
          id: registration.schedule.id,
          teacher: {
            fullname: registration.schedule.teacher.user.fullname,
          },
          classroom: {
            name: registration.schedule.classroom.name,
          },
          course: {
            courseId: registration.schedule.course.id,
            name: registration.schedule.course.name,
            skill: registration.schedule.course.courseSkill,
            thumbnail:
              buildCourseThumbnailUrl(registration.schedule.course.thumbnail) ??
              "default.jpg",
          },
          startTime: registration.schedule.startTime,
          endTime: registration.schedule.endTime,
         
        })),
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy danh sách học sinh theo phụ huynh: " +
        (error as Error).message,
      500,
    );
  }
};

// Soft delete học sinh
export const deleteStudentService = async (id: number): Promise<void> => {
  const student = await prisma.studentInfo.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!student) {
    throw new AppError("Không tìm thấy học sinh", 404);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete student info
      await tx.studentInfo.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete user
      await tx.user.update({
        where: { id: student.userId },
        data: { deletedAt: new Date() },
      });
    });
  } catch (error) {
    throw new AppError(
      "Lỗi khi xóa học sinh: " + (error as Error).message,
      500,
    );
  }
};