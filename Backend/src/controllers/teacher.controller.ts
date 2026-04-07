import { Request, Response } from "express";
import { CustomResponse } from "../config/response.custom";
import { AppError } from "../middleware/errorHandler";
import {
  createTeacherService,
  getAllTeachersService,
  getTeacherByIdService,
  updateTeacherService,
  getTeacherByUserIdService,
  updateTeacherByUserIdService,
  deleteTeacherService,
} from "../services/teacher.service";
import { GetTeacherRequest } from "../DTOS/Teacher";

// Tạo giáo viên mới
export const createTeacher = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  
  // Avatar là bắt buộc khi tạo teacher
  if (!req.file) {
    throw new Error("Avatar là bắt buộc khi tạo giáo viên");
  }
  
  req.body.avatar = req.file.filename;
  const result = await createTeacherService(req.body);
  return customRes.success(result, "Tạo giáo viên thành công");
};

// Lấy danh sách giáo viên
export const getAllTeachers = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const queryParams: GetTeacherRequest = {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
    sortOrder:
      req.query.sortOrder === "asc"
        ? "asc"
        : req.query.sortOrder === "desc"
          ? "desc"
          : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    degree: req.query.degree ? String(req.query.degree) : undefined,
    isTeaching:
      req.query.isTeaching === "true"
        ? true
        : req.query.isTeaching === "false"
          ? false
          : undefined,
  };
  const result = await getAllTeachersService(queryParams);
  return customRes.success(result, "Lấy danh sách giáo viên thành công");
};

// Lấy giáo viên theo ID
export const getTeacherById = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("ID giáo viên không hợp lệ", 400);
  }
  const result = await getTeacherByIdService(id);
  return customRes.success(result, "Lấy thông tin giáo viên thành công");
};

// Lấy giáo viên hiện tại (từ JWT)
export const getTeacherMe = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const result = await getTeacherByUserIdService(req.user.id);
  return customRes.success(result, "Lấy thông tin giáo viên thành công");
};

// Cập nhật giáo viên hiện tại (từ JWT)
export const updateTeacherMe = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  // Nếu có upload avatar
  if (req.file) {
    req.body.avatar = req.file.filename;
  }

  const result = await updateTeacherByUserIdService(req.user.id, req.body);
  return customRes.success(result, "Cập nhật giáo viên thành công");
};

// Cập nhật giáo viên
export const updateTeacher = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);

  // Nếu có upload avatar
  if (req.file) {
    req.body.avatar = req.file.filename;
  }

  const result = await updateTeacherService(id, req.body);
  return customRes.success(result, "Cập nhật giáo viên thành công");
};

// Xóa giáo viên (soft delete)
export const deleteTeacher = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);
  await deleteTeacherService(id);
  return customRes.success(null, "Xóa giáo viên thành công");
};

