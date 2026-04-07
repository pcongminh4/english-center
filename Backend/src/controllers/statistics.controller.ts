import { Request, Response } from "express";
import { 
  getCourseRegistrationStatsService, 
  getRevenueStatsService,
  getRevenueStatsByUserService,
  getAllCoursesForFilterService,
  getAdmissionStudentsService,
  getAdmissionStudentDetailService
} from "../services/statistics.service";

export class StatisticsController {
  // GET /api/statistics/course-registrations
  getCourseRegistrationStats = async (req: Request, res: Response) => {
    try {
      const { periodType, date, month, year } = req.query;
      const stats = await getCourseRegistrationStatsService({
        periodType: periodType as "day" | "month" | "year" | undefined,
        date: date as string | undefined,
        month: month as string | undefined,
        year: year ? parseInt(year as string, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting course registration stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê đăng ký khóa học",
      });
    }
  };

  // GET /api/statistics/revenue
  // Query params: courseId, periodType, date, month, year (optional)
  getRevenueStats = async (req: Request, res: Response) => {
    try {
      const { courseId, periodType, date, month, year } = req.query;
      const courseIdNum = courseId ? parseInt(courseId as string) : undefined;
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        return res.status(401).json({
          success: false,
          message: "Bạn chưa đăng nhập",
        });
      }
      
      const stats = await getRevenueStatsService(courseIdNum, {
        periodType: periodType as "day" | "month" | "year" | undefined,
        date: date as string | undefined,
        month: month as string | undefined,
        year: year ? parseInt(year as string, 10) : undefined,
      });
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting revenue stats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê doanh thu",
      });
    }
  };

  // GET /api/statistics/courses
  getAllCoursesForFilter = async (req: Request, res: Response) => {
    try {
      const courses = await getAllCoursesForFilterService();
      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      console.error("Error getting courses for filter:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học",
      });
    }
  };

  // GET /api/statistics/admission-students
  // Query params: page, limit, search, courseId, startDate, endDate
  getAdmissionStudents = async (req: Request, res: Response) => {
    try {
      const { page, limit, search, courseId, startDate, endDate } = req.query;
      
      const data = await getAdmissionStudentsService({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string || "",
        courseId: courseId ? parseInt(courseId as string) : undefined,
        startDate: startDate as string || undefined,
        endDate: endDate as string || undefined,
      });
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error getting admission students:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách học sinh tuyển sinh",
      });
    }
  };

  // GET /api/statistics/admission-students/:id
  getAdmissionStudentDetail = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const studentId = parseInt(Array.isArray(id) ? id[0] : id, 10);
      
      if (isNaN(studentId)) {
        res.status(400).json({
          success: false,
          message: "ID không hợp lệ",
        });
        return;
      }
      
      const detail = await getAdmissionStudentDetailService(studentId);

      if (!detail) {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh",
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error) {
      console.error("Error getting admission student detail:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết học sinh tuyển sinh",
      });
    }
  };
}

export default new StatisticsController();
