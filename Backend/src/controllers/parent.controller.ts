import { Request, Response } from "express";
import { CustomResponse } from "../config/response.custom";
import {
  createParentService,
  getAllParentsService,
  getParentByIdService,
  updateParentService,
  getParentByUserIdService,
  updateParentByUserIdService,
  deleteParentService,
  linkStudentToParentService,
  unlinkStudentFromParentService,
} from "../services/parent.service";
import { GetParentRequest } from "../DTOS/Parent";

// Tạo phụ huynh mới
export const createParent = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const result = await createParentService(req.body);
  return customRes.success(result, "Tạo phụ huynh thành công");
};

// Lấy danh sách phụ huynh
export const getAllParents = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const queryParams: GetParentRequest = {
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
  };
  const result = await getAllParentsService(queryParams);
  return customRes.success(result, "Lấy danh sách phụ huynh thành công");
};

// Lấy phụ huynh theo ID
export const getParentById = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);
  const result = await getParentByIdService(id);
  return customRes.success(result, "Lấy thông tin phụ huynh thành công");
};

// Cập nhật phụ huynh
export const updateParent = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);
  const result = await updateParentService(id, req.body);
  return customRes.success(result, "Cập nhật phụ huynh thành công");
};

// Lấy phụ huynh hiện tại (từ JWT)
export const getParentMe = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const result = await getParentByUserIdService(req.user.id);
  return customRes.success(result, "Lấy thông tin phụ huynh thành công");
};

// Cập nhật phụ huynh hiện tại (từ JWT)
export const updateParentMe = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const result = await updateParentByUserIdService(req.user.id, req.body);
  return customRes.success(result, "Cập nhật phụ huynh thành công");
};

// Xóa phụ huynh (soft delete)
export const deleteParent = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);
  await deleteParentService(id);
  return customRes.success(null, "Xóa phụ huynh thành công");
};

// Liên kết học sinh với phụ huynh
export const linkStudentToParent = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const parentId = Number(req.params.parentId);
  const studentId = Number(req.params.studentId);
  await linkStudentToParentService(parentId, studentId);
  return customRes.success(null, "Liên kết học sinh thành công");
};

// Hủy liên kết học sinh với phụ huynh
export const unlinkStudentFromParent = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const parentId = Number(req.params.parentId);
  const studentId = Number(req.params.studentId);
  await unlinkStudentFromParentService(parentId, studentId);
  return customRes.success(null, "Hủy liên kết học sinh thành công");
};
