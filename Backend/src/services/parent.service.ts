import bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { ParentResponse } from "../DTOS/Parent/parent.response";
import { toParentResponse } from "../utils/Mapper/parent.mapper";
import { PagingData } from "../DTOS/pagination";
import { CreateParentRequest, GetParentRequest, UpdateParentRequest } from "../DTOS/Parent";

// Tạo phụ huynh mới
export const createParentService = async (
  data: CreateParentRequest,
): Promise<ParentResponse> => {
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

    // Tạo user và parent info trong một transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullname: data.fullname,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: "PARENT",
        },
      });

      const parentInfo = await tx.parentInfo.create({
        data: {
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      return parentInfo;
    });

    return toParentResponse(result);
  } catch (error) {
    throw new AppError(
      "Lỗi khi tạo phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách phụ huynh với filters
export const getAllParentsService = async (
  req: GetParentRequest,
): Promise<PagingData<ParentResponse>> => {
  try {
    // Build where clause
    const where: any = {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    };

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

    // Đếm tổng số parents
    const totalItems = await prisma.parentInfo.count({ where });

    // Lấy danh sách parents với students
    const parents = await prisma.parentInfo.findMany({
      where,
      include: {
        user: true,
        students: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
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
      data: parents.map(toParentResponse),
      page: req.page || 1,
      limit: req.limit || parents.length,
      totalPages: req.limit ? Math.ceil(totalItems / req.limit) : 1,
      totalItems,
    };
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy danh sách phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy phụ huynh theo ID
export const getParentByIdService = async (
  id: number,
): Promise<ParentResponse> => {
  try {
    const parent = await prisma.parentInfo.findFirst({
      where: {
        id,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        students: {
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

    if (!parent) {
      throw new AppError("Không tìm thấy phụ huynh", 404);
    }

    return toParentResponse(parent);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Cập nhật phụ huynh
export const updateParentService = async (
  id: number,
  data: UpdateParentRequest,
): Promise<ParentResponse> => {
  // Kiểm tra phụ huynh tồn tại
  const parent = await prisma.parentInfo.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!parent) {
    throw new AppError("Không tìm thấy phụ huynh", 404);
  }

  // Kiểm tra email và phone nếu có thay đổi
  if (data.email && data.email !== parent.user.email) {
    // Chỉ check database khi email thực sự thay đổi
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail && existingEmail.email !== parent.user.email) {
      throw new AppError("Email đã tồn tại", 400);
    }
  }

  if (data.phone && data.phone !== parent.user.phone) {
    // Chỉ check database khi phone thực sự thay đổi
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone && existingPhone.phone !== parent.user.phone) {
      throw new AppError("Số điện thoại đã tồn tại", 400);
    }
  }

  try {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    // Cập nhật user info
    await prisma.user.update({
      where: { id: parent.userId },
      data: {
        ...(data.fullname && { fullname: data.fullname }),
        ...(data.email && { email: data.email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    // Lấy lại parent với thông tin mới
    const updatedParent = await prisma.parentInfo.findFirst({
      where: { id },
      include: {
        user: true,
        students: {
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

    return toParentResponse(updatedParent!);
  } catch (error) {
    throw new AppError(
      "Lỗi khi cập nhật phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Lấy phụ huynh hiện tại theo userId (JWT)
export const getParentByUserIdService = async (
  userId: number,
): Promise<ParentResponse> => {
  try {
    const parent = await prisma.parentInfo.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        students: {
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

    if (!parent) {
      throw new AppError("Không tìm thấy phụ huynh", 404);
    }

    return toParentResponse(parent);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Cập nhật phụ huynh hiện tại theo userId (JWT)
export const updateParentByUserIdService = async (
  userId: number,
  data: UpdateParentRequest,
): Promise<ParentResponse> => {
  // Resolve parentInfo.id first, then reuse existing update logic (incl. checks)
  const parent = await prisma.parentInfo.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (!parent) {
    throw new AppError("Không tìm thấy phụ huynh", 404);
  }

  return updateParentService(parent.id, data);
};

// Soft delete phụ huynh
export const deleteParentService = async (id: number): Promise<void> => {
  const parent = await prisma.parentInfo.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!parent) {
    throw new AppError("Không tìm thấy phụ huynh", 404);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete parent info
      await tx.parentInfo.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete user
      await tx.user.update({
        where: { id: parent.userId },
        data: { deletedAt: new Date() },
      });
    });
  } catch (error) {
    throw new AppError(
      "Lỗi khi xóa phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Liên kết học sinh với phụ huynh
export const linkStudentToParentService = async (
  parentId: number,
  studentId: number,
): Promise<void> => {
  // Kiểm tra parent tồn tại
  const parent = await prisma.parentInfo.findFirst({
    where: { id: parentId, deletedAt: null },
  });
  if (!parent) {
    throw new AppError("Không tìm thấy phụ huynh", 404);
  }

  // Kiểm tra student tồn tại
  const student = await prisma.studentInfo.findFirst({
    where: { id: studentId, deletedAt: null },
  });
  if (!student) {
    throw new AppError("Không tìm thấy học sinh", 404);
  }

  // Kiểm tra đã liên kết chưa
  const existing = await prisma.parentStudent.findFirst({
    where: { parentId, studentId },
  });
  if (existing) {
    throw new AppError("Học sinh đã được liên kết với phụ huynh này", 400);
  }

  try {
    await prisma.parentStudent.create({
      data: {
        parentId,
        studentId,
      },
    });
  } catch (error) {
    throw new AppError(
      "Lỗi khi liên kết học sinh với phụ huynh: " + (error as Error).message,
      500,
    );
  }
};

// Hủy liên kết học sinh với phụ huynh
export const unlinkStudentFromParentService = async (
  parentId: number,
  studentId: number,
): Promise<void> => {
  const link = await prisma.parentStudent.findFirst({
    where: { parentId, studentId },
  });

  if (!link) {
    throw new AppError("Không tìm thấy liên kết", 404);
  }

  try {
    await prisma.parentStudent.delete({
      where: {
        id: link.id,
      },
    });
  } catch (error) {
    throw new AppError(
      "Lỗi khi hủy liên kết: " + (error as Error).message,
      500,
    );
  }
};
