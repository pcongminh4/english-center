import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { CourseResponse } from "../DTOS/Course/course.response";
import { toCourseResponse } from "../utils/Mapper/course.mapper";
import { PagingData } from "../DTOS/pagination";
import {
  CreateCourseRequest,
  GetCourseRequest,
  UpdateCourseRequest,
} from "../DTOS/Course";

// Tạo khóa học mới
export const createCourseService = async (
  data: CreateCourseRequest,
): Promise<CourseResponse> => {
  // Kiểm tra tên khóa học đã tồn tại
  const existingCourse = await prisma.course.findFirst({
    where: { name: data.name },
  });

  if (existingCourse) {
    throw new AppError("Tên khóa học đã tồn tại", 400);
  }

  // Validate business logic cho CourseType
  if (data.type === "COURSE") {
    // Nếu type là COURSE, minBand và maxBand là bắt buộc
    if (data.minBand === undefined || data.minBand === null) {
      throw new AppError("Band tối thiểu là bắt buộc đối với loại COURSE", 400);
    }
    if (data.maxBand === undefined || data.maxBand === null) {
      throw new AppError("Band tối đa là bắt buộc đối với loại COURSE", 400);
    }
    // Kiểm tra maxBand >= minBand
    if (data.maxBand < data.minBand) {
      throw new AppError(
        "Band tối đa phải lớn hơn hoặc bằng band tối thiểu",
        400,
      );
    }
  } else if (data.type === "TEST_PREPARATION") {
    // Nếu type là TEST_PREPARATION, bands là optional
    // Nếu có cung cấp cả hai, validate maxBand >= minBand
    if (
      data.minBand !== undefined &&
      data.minBand !== null &&
      data.maxBand !== undefined &&
      data.maxBand !== null
    ) {
      if (data.maxBand < data.minBand) {
        throw new AppError(
          "Band tối đa phải lớn hơn hoặc bằng band tối thiểu",
          400,
        );
      }
    }
  }

  try {
    const course = await prisma.course.create({
      data: {
        type: data.type as any, // Cast to any để phù hợp với Prisma enum
        name: data.name,
        courseSkill: data.courseSkill as any,
        status: "PLANNING", // Default status
        price: data.price,
        sale: data.sale ? Number(data.sale) : 0,
        thumbnail: data.thumbnail,
        totalSession: data.totalSession ? Number(data.totalSession) : 0,
        minBand: data.minBand !== null ? Number(data.minBand) : null,
        maxBand: data.maxBand !== null ? Number(data.maxBand) : null,
      },
    });

    return toCourseResponse(course);
  } catch (error) {
    throw new AppError(
      "Lỗi khi tạo khóa học: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách khóa học với filters
export const getAllCoursesService = async (
  req: GetCourseRequest,
): Promise<PagingData<CourseResponse>> => {
  try {
    // Build where clause
    const where: any = {};

    // Search trong type và name
    if (req.search) {
      where.OR = [{ name: { contains: req.search } }];
    }

    // Filter by type
    if (req.type) {
      where.type = req.type;
    }

    // Filter by courseSkill
    if (req.courseSkill) {
      where.courseSkill = req.courseSkill;
    }

    // Filter by status
    if (req.status) {
      where.status = req.status;
    }

    // Filter by price range
    if (req.minPrice !== undefined || req.maxPrice !== undefined) {
      where.price = {};
      if (req.minPrice !== undefined) {
        where.price.gte = req.minPrice;
      }
      if (req.maxPrice !== undefined) {
        where.price.lte = req.maxPrice;
      }
    }

    // Filter by band range
    if (req.minBand !== undefined) {
      where.minBand = {
        gte: req.minBand,
      };
    }
    if (req.maxBand !== undefined) {
      where.maxBand = {
        lte: req.maxBand,
      };
    }

    // Đếm tổng số courses
    const totalItems = await prisma.course.count({ where });

    // Lấy danh sách courses
    const courses = await prisma.course.findMany({
      where,
      take: req.limit,
      skip: req.page && req.limit ? (req.page - 1) * req.limit : undefined,
      orderBy: req.sortBy
        ? {
            [req.sortBy]: req.sortOrder || "asc",
          }
        : { createdAt: "desc" },
    });

    return {
      data: courses.map(toCourseResponse),
      page: req.page || 1,
      limit: req.limit || courses.length,
      totalPages: req.limit ? Math.ceil(totalItems / req.limit) : 1,
      totalItems,
    };
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy danh sách khóa học: " + (error as Error).message,
      500,
    );
  }
};

// Lấy danh sách khóa học đang ACTIVE và có lịch học trong tương lai
export const getActiveCoursesWithFutureSchedulesService = async (): Promise<
  CourseResponse[]
> => {
  try {
    const now = new Date();

    const courses = await prisma.course.findMany({
      where: {
        status: "ACTIVE",
        schedules: {
          some: {
            startTime: {
              gt: now,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    return courses.map(toCourseResponse);
  } catch (error) {
    throw new AppError(
      "Lỗi khi lấy danh sách khóa học đang hoạt động: " +
        (error as Error).message,
      500,
    );
  }
};

// Lấy khóa học theo ID
export const getCourseByIdService = async (
  id: number,
): Promise<CourseResponse> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new AppError("Không tìm thấy khóa học", 404);
    }

    return toCourseResponse(course);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Lỗi khi lấy thông tin khóa học: " + (error as Error).message,
      500,
    );
  }
};

// Cập nhật khóa học
export const updateCourseService = async (
  id: number,
  data: UpdateCourseRequest,
): Promise<CourseResponse> => {
  // 1. Kiểm tra khóa học tồn tại
  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new AppError("Không tìm thấy khóa học", 404);
  }

  const parsedMinBand =
    data.minBand !== undefined && data.minBand !== null
      ? Number(data.minBand)
      : data.minBand;

  const parsedMaxBand =
    data.maxBand !== undefined && data.maxBand !== null
      ? Number(data.maxBand)
      : data.maxBand;

  const parsedSale = data.sale !== undefined ? Number(data.sale) : undefined;

  if (data.name && data.name !== course.name) {
    const existingCourse = await prisma.course.findFirst({
      where: { name: data.name },
    });
    if (existingCourse && existingCourse.id !== id) {
      throw new AppError("Tên khóa học đã tồn tại", 400);
    }
  }

  const newType = data.type || course.type;
  const finalMinBand =
    parsedMinBand !== undefined ? parsedMinBand : course.minBand;
  const finalMaxBand =
    parsedMaxBand !== undefined ? parsedMaxBand : course.maxBand;

  if (newType === "COURSE") {
    if (finalMinBand === null || finalMinBand === undefined) {
      throw new AppError("Band tối thiểu là bắt buộc đối với loại COURSE", 400);
    }
    if (finalMaxBand === null || finalMaxBand === undefined) {
      throw new AppError("Band tối đa là bắt buộc đối với loại COURSE", 400);
    }
    if (finalMaxBand < finalMinBand) {
      throw new AppError(
        "Band tối đa phải lớn hơn hoặc bằng band tối thiểu",
        400,
      );
    }
  } else if (newType === "TEST_PREPARATION") {
    if (finalMinBand !== null && finalMaxBand !== null) {
      if (finalMaxBand < finalMinBand) {
        throw new AppError(
          "Band tối đa phải lớn hơn hoặc bằng band tối thiểu",
          400,
        );
      }
    }
  }

  // Kiểm tra status
  if (data.status!=undefined&&data.status!==course.status){
    const today = new Date();

    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        coursesId: id,
        endTime: {
          gt: today
        }
      }
    });
    if (course.status==="INACTIVE" && data.status=="ACTIVE"){
      throw new AppError(
      "Không được thay đổi sang ACTIVE",
      400,);
    }
    if (course.status==="ACTIVE" && existingSchedule){
      throw new AppError(
      "Khóa học đang ACTIVE và còn lịch học trong tương lai nên không thể thay đổi trạng thái",
      400,);
    }

  }

  // 5. Cập nhật vào Database
  try {
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.courseSkill !== undefined && {
          courseSkill: data.courseSkill as any,
        }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.price !== undefined && { price: data.price }),
        ...(parsedSale !== undefined && { sale: parsedSale }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.totalSession !== undefined && { totalSession: Number(data.totalSession) }),
        ...(parsedMinBand !== undefined && { minBand: parsedMinBand }),
        ...(parsedMaxBand !== undefined && { maxBand: parsedMaxBand }),
      },
    });

    return toCourseResponse(updatedCourse);
  } catch (error) {
    throw new AppError(
      "Lỗi khi cập nhật khóa học: " + (error as Error).message,
      500,
    );
  }
};

// Xóa khóa học (hard delete vì không có deletedAt trong schema)
export const deleteCourseService = async (id: number): Promise<void> => {
  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new AppError("Không tìm thấy khóa học", 404);
  }

  if (course.status === "ACTIVE") {
    throw new AppError(
      "Không thể xóa khóa học vì đang có học viên hoặc lịch học sử dụng",
      400,
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Xóa các CourseTest liên quan
      await tx.courseTest.deleteMany({
        where: { courseId: id },
      });

      // Xóa khóa học
      await tx.course.delete({
        where: { id },
      });
    });
  } catch (error) {
    throw new AppError(
      "Lỗi khi xóa khóa học: " + (error as Error).message,
      500,
    );
  }
};
