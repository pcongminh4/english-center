import bcrypt from "bcryptjs";

import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";
import { User } from "@prisma/client";
import {
  CreateUserRequest,
  GetUserRequest,
  UpdateUserRequest,
} from "../DTOS/User/user.request";
import { UserResponse } from "../DTOS/User/user.response";
import { toUserResponse } from "../utils/Mapper/user.mapper";
import { PagingData } from "../DTOS/pagination";

export const createUser = async (
  userData: CreateUserRequest,
): Promise<UserResponse> => {
  // Check if user already exists
  const existingPhone = await findUserByPhone(userData.phone);
  const existingEmail = await findUserByEmail(userData.email);
  if (existingEmail) {
    throw new AppError("Email đã tồn tại", 400);
  }
  if (existingPhone) {
    throw new AppError("Số điện thoại đã tồn tại", 400);
  }
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
    return toUserResponse(user);
  } catch (error) {
    throw new AppError(
      "Lỗi khi tạo người dùng: " + (error as Error).message,
      400,
    );
  }
};

export const getAllUsers = async (
  req: GetUserRequest,
): Promise<PagingData<UserResponse>> => {
  try {
    // Đếm tổng số users trong database (không bị ảnh hưởng bởi pagination)
    const totalItems = await prisma.user.count({
      where: {
        deletedAt: null,
      },
    });

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      take: req.limit,
      skip: req.page && req.limit ? (req.page - 1) * req.limit : undefined,
      orderBy: req.sortBy
        ? {
            [req.sortBy]: req.sortOrder,
          }
        : undefined,
    });

    const PagingData: PagingData<UserResponse> = {
      data: users.map(toUserResponse),
      page: req.page || 1,
      limit: req.limit || users.length,
      totalPages: req.limit ? Math.ceil(totalItems / req.limit) : 1,
      totalItems: totalItems,
    };
    return PagingData;
  } catch (error) {
    throw new AppError(
      "Error retrieving all users with mess: " + (error as Error).message,
      400,
    );
  }
};

export const findUserByPhone = async (phone: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { phone },
    });
    return user;
  } catch (error) {
    throw new AppError(
      "Error retrieving user by phone with mess: " + (error as Error).message,
      400,
    );
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    throw new AppError(
      "Error retrieving user by email with mess: " + (error as Error).message,
      400,
    );
  }
};
export const findUserById = async (id: number): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    throw new AppError(
      "Error retrieving user by ID with mess: " + (error as Error).message,
      400,
    );
  }
};

export const updateUserById = async (
  id: number,
  userData: UpdateUserRequest,
): Promise<UserResponse> => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  if (userData.email && userData.email !== user.email) {
    const existingEmail = await findUserByEmail(userData.email);
    if (existingEmail && existingEmail.id !== user.id) {
      throw new AppError("Email đã tồn tại", 400);
    }
  }

  if (userData.phone && userData.phone !== user.phone) {
    const existingPhone = await findUserByPhone(userData.phone);
    if (existingPhone && existingPhone.id !== user.id) {
      throw new AppError("Số điện thoại đã tồn tại", 400);
    }
  }

  try {
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(userData.fullname && { fullname: userData.fullname }),
        ...(userData.email && { email: userData.email }),
        ...(userData.phone && { phone: userData.phone }),
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    return toUserResponse(updatedUser);
  } catch (error) {
    throw new AppError(
      "Lỗi khi cập nhật người dùng: " + (error as Error).message,
      400,
    );
  }
};
