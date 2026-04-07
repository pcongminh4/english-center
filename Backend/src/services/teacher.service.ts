import bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { TeacherResponse } from "../DTOS/Teacher/teacher.response";
import { toTeacherResponse } from "../utils/Mapper/teacher.mapper";
import { PagingData } from "../DTOS/pagination";
import { CreateTeacherRequest, GetTeacherRequest, UpdateTeacherRequest } from "../DTOS/Teacher";

const toBoolean = (value: boolean | string | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  return value === true || value === "true";
};

// Tạo giáo viên mới
export const createTeacherService = async (
  data: CreateTeacherRequest,
): Promise<TeacherResponse> => {
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

    // Tạo user và teacher info trong một transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullname: data.fullname,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: "TEACHER",
        },
      });

      const teacherInfo = await tx.teacherInfo.create({
        data: {
          userId: user.id,
          degree: data.degree,
          avatar: data.avatar,
          isTeaching: data.isTeaching === true || data.isTeaching === "true",
        },
        include: {
          user: true,
        },
      });

      return teacherInfo;
    });

    return toTeacherResponse(result);
  } catch (error) {
    throw new AppError(
      "Lỗi khi tạo giáo viên: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách giáo viên với filters
export const getAllTeachersService = async (
  req: GetTeacherRequest,
): Promise<PagingData<TeacherResponse>> => {
  try {
    // Build where clause
    const where: any = {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    };

    // Filter by degree
    if (req.degree) {
      where.degree = {
        contains: req.degree,
      };
    }

    // Filter by isTeaching
    if (req.isTeaching !== undefined) {
      where.isTeaching = req.isTeaching;
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

    // Đếm tổng số teachers
    const totalItems = await prisma.teacherInfo.count({ where });

    // Lấy danh sách teachers
    const teachers = await prisma.teacherInfo.findMany({
      where,
      include: {
        user: true,
        freeDays: true
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
      data: teachers.map(toTeacherResponse),
      page: req.page || 1,
      limit: req.limit || teachers.length,
      totalPages: req.limit ? Math.ceil(totalItems / req.limit) : 1,
      totalItems,
    };
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy danh sách giáo viên: " + (error as Error).message,
      500,
    );
  }
};

// Lấy giáo viên theo ID
export const getTeacherByIdService = async (
  id: number,
): Promise<TeacherResponse> => {
  try {
    const teacher = await prisma.teacherInfo.findFirst({
      where: {
        id,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        freeDays: true,
      },
      
    });

    if (!teacher) {
      throw new AppError("Không tìm thấy giáo viên", 404);
    }

    return toTeacherResponse(teacher);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin giáo viên: " + (error as Error).message,
      500,
    );
  }
};

// Lấy giáo viên hiện tại theo userId (JWT)
export const getTeacherByUserIdService = async (
  userId: number,
): Promise<TeacherResponse> => {
  try {
    const teacher = await prisma.teacherInfo.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        freeDays: true,
      },
    });

    if (!teacher) {
      throw new AppError("Không tìm thấy giáo viên", 404);
    }

    return toTeacherResponse(teacher);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin giáo viên: " + (error as Error).message,
      500,
    );
  }
};

// Cập nhật giáo viên hiện tại theo userId (JWT)
export const updateTeacherByUserIdService = async (
  userId: number,
  data: UpdateTeacherRequest,
): Promise<TeacherResponse> => {
  const teacher = await prisma.teacherInfo.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (!teacher) {
    throw new AppError("Không tìm thấy giáo viên", 404);
  }

  return updateTeacherService(teacher.id, data);
};

// Cập nhật giáo viên
export const updateTeacherService = async (
  id: number,
  data: UpdateTeacherRequest,
): Promise<TeacherResponse> => {
  // Kiểm tra giáo viên tồn tại
  const teacher = await prisma.teacherInfo.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!teacher) {
    throw new AppError("Không tìm thấy giáo viên", 404);
  }

  // Kiểm tra email và phone nếu có thay đổi
  if (data.email && data.email !== teacher.user.email) {
    // Chỉ check database khi email thực sự thay đổi
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail && existingEmail.email !== teacher.user.email) {
      throw new AppError("Email đã tồn tại", 400);
    }
  }

  if (data.phone && data.phone !== teacher.user.phone) {
    // Chỉ check database khi phone thực sự thay đổi
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone && existingPhone.phone !== teacher.user.phone) {
      throw new AppError("Số điện thoại đã tồn tại", 400);
    }
  }

  const nextIsTeaching = toBoolean(data.isTeaching);
  if (teacher.isTeaching && nextIsTeaching === false) {
    const now = new Date();
    const activeOrUpcomingSchedule = await prisma.schedule.findFirst({
      where: {
        teacherId: id,
        endTime: {
          gte: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (activeOrUpcomingSchedule) {
      throw new AppError("Cập nhật giáo viên thất bại!", 400);
    }
  }

  try {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật user info nếu có
      if (data.fullname || data.email || data.phone || hashedPassword) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: {
            ...(data.fullname && { fullname: data.fullname }),
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
            ...(hashedPassword && { password: hashedPassword }),
          },
        });
      }

      // Cập nhật teacher info
      const updatedTeacher = await tx.teacherInfo.update({
        where: { id },
        data: {
          ...(data.degree && { degree: data.degree }),
          ...(data.isTeaching !== undefined && {
            isTeaching: nextIsTeaching!,
          }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
        include: {
          user: true,
        },
      });

      return updatedTeacher;
    });

    return toTeacherResponse(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi cập nhật giáo viên: " + (error as Error).message,
      500,
    );
  }
};

// Soft delete giáo viên
export const deleteTeacherService = async (id: number): Promise<void> => {
  const teacher = await prisma.teacherInfo.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!teacher) {
    throw new AppError("Không tìm thấy giáo viên", 404);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete teacher info
      await tx.teacherInfo.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete user
      await tx.user.update({
        where: { id: teacher.userId },
        data: { deletedAt: new Date() },
      });
    });
  } catch (error) {
    throw new AppError(
      "Lỗi khi xóa giáo viên: " + (error as Error).message,
      500,
    );
  }
};


