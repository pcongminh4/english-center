import { Request, Response } from "express";
import { CustomResponse } from "../config/response.custom";
import {
  createScheduleService,
  deleteScheduleService,
  getActiveSchedulesByCourseIdService,
  getAllSchedulesService,
  getScheduleByIdService,
  getUpcomingSchedulesService,
  searchSchedulesAdvancedService,
  updateScheduleService,
} from "../services/schedule.service";

// Tạo lịch
export const createSchedule = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  const result = await createScheduleService(req.body);

  return customRes.success(result, "Tạo lịch học thành công");
};

// Lấy 3 Schedule gần từ tính từ ngày mai
export const getUpcomingSchedules = async (_req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  const result = await getUpcomingSchedulesService();

  return customRes.success(result, "Lấy lịch học sắp tới thành công");
};

// Lấy tất cả Schedule còn hiệu lực (startTime > hôm nay) + phân trang
export const getActiveSchedulesByCourseId = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;

  const result = await getActiveSchedulesByCourseIdService({
    page,
    limit,
    courseId,
  });

  return customRes.success(result, "Lấy danh sách lịch học còn hiệu lực thành công");
};

// Lấy tất cả Schedule + phân trang
export const getAllSchedules = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await getAllSchedulesService({
    page,
    limit,
  });

  return customRes.success(result, "Lấy danh sách lịch học thành công");
};

// Tìm kiếm nâng cao theo tên khóa học + ngày bắt đầu
export const searchSchedulesAdvanced = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const courseName = req.query.courseName
    ? String(req.query.courseName)
    : undefined;
  const startDate = req.query.startDate
    ? String(req.query.startDate)
    : undefined;

  const result = await searchSchedulesAdvancedService({
    page,
    limit,
    courseName,
    startDate,
  });

  return customRes.success(result, "Tìm kiếm lịch học thành công");
};

// Lấy chi tiết Schedule theo ID
export const getScheduleById = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;

  const id = Number(req.params.id);

  if (isNaN(id)) {
    return customRes.error("ID không hợp lệ", 400);
  }

  const result = await getScheduleByIdService(id);

  if (!result) {
    return customRes.error("Không tìm thấy đợt mở lớp", 404);
  }

  return customRes.success(result, "Lấy chi tiết lịch học thành công");
};

// Cập nhật Schedule theo ID
export const updateSchedule = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return customRes.error("ID không hợp lệ", 400);
  }

  const result = await updateScheduleService(id, req.body);
  return customRes.success(result, "Cập nhật lịch học thành công");
};

// Xóa Schedule theo ID
export const deleteSchedule = async (req: Request, res: Response) => {
  const customRes = res as CustomResponse;
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return customRes.error("ID không hợp lệ", 400);
  }

  await deleteScheduleService(id);
  return customRes.success(null, "Xóa lịch học thành công");
};

