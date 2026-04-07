import { Request, Response } from "express";
import { CustomResponse } from "../config/response.custom";
import {
  getAdminDashboardOverviewService,
  getParentDashboardOverviewService,
} from "../services/dashboard.service";
import { StatisticsPeriodFilter } from "../services/statistics.service";

const parsePeriodFilter = (req: Request): StatisticsPeriodFilter => {
  const { periodType, date, month, year } = req.query;

  return {
    periodType: periodType as "day" | "month" | "year" | undefined,
    date: date as string | undefined,
    month: month as string | undefined,
    year: year ? parseInt(year as string, 10) : undefined,
  };
};

class DashboardController {
  getAdminOverview = async (req: Request, res: Response) => {
    const customRes = res as CustomResponse;
    const filter = parsePeriodFilter(req);

    const data = await getAdminDashboardOverviewService(filter);
    return customRes.success(data, "Lấy dữ liệu tổng quan Admin thành công");
  };

  getParentOverview = async (req: Request, res: Response) => {
    const customRes = res as CustomResponse;
    const filter = parsePeriodFilter(req);
    const studentId = req.query.studentId
      ? parseInt(req.query.studentId as string, 10)
      : undefined;

    if (!req.user?.id) {
      return customRes.error("Bạn chưa đăng nhập", 401);
    }

    const data = await getParentDashboardOverviewService(
      req.user.id,
      filter,
      studentId,
    );

    return customRes.success(data, "Lấy dữ liệu tổng quan Phụ huynh thành công");
  };
}

export default new DashboardController();
