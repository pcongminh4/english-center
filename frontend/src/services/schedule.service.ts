import type { ApiResponse } from "../types/api.type";
import type { ScheduleListResponse, ScheduleResponse } from "../types/schedule/schedule.response";
import type {
  ScheduleStudentListResponse,
  StudentScheduleByIdResponse,
  StudentSchedulesByStudentIdResponse,
} from "../types/schedule/student-schedule.response";
import axios from "../configs/axios.config";
import type { CreateScheduleRequest } from "../types/schedule/create-schedule.request";
import type { UpdateScheduleRequest } from "../types/schedule/update-schedule.request";

// Tạo schedule + session schedule
export const createSchedule = async (
  data: CreateScheduleRequest
): Promise<ApiResponse<ScheduleResponse>> => {
  const response = await axios.post<ApiResponse<ScheduleResponse>>(
    "/schedule",
    data
  );
  return response.data;
};  

// Lấy 3 course có thời gian bắt đầu gần hiện tại nhất
export const getUpcomingSchedules = async (): Promise<ApiResponse<ScheduleResponse[]>> => {
  const response = await axios.get<ApiResponse<ScheduleResponse[]>>("/schedule/upcoming");
  return response.data;
};

// Lấy tất cả Schedule còn hiệu lực (startTime > hôm nay) + phân trang
export const getActiveSchedules = async (
  page = 1,
  limit = 10,
  courseId?: number,
): Promise<ApiResponse<ScheduleListResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleListResponse>>(
    "/schedule/active-schedule",
    {
      params: { page, limit, courseId },
    }
  );

  return response.data;
};


// Lấy tất cả Schedule + phân trang
export const getAllSchedules = async (
  page = 1,
  limit = 10,
): Promise<ApiResponse<ScheduleListResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleListResponse>>(
    "/schedule",
    {
      params: { page, limit },
    }
  );

  return response.data;
};

// Tìm kiếm nâng cao theo tên khóa học + ngày bắt đầu
export const searchSchedulesAdvanced = async (
  page = 1,
  limit = 10,
  params?: {
    courseName?: string;
    startDate?: string;
  },
): Promise<ApiResponse<ScheduleListResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleListResponse>>(
    "/schedule/search/advanced",
    {
      params: {
        page,
        limit,
        ...params,
      },
    }
  );

  return response.data;
};

// Lấy chi tiết Schedule theo ID
export const getScheduleById = async (
  id: number
): Promise<ApiResponse<ScheduleResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleResponse>>(
    `/schedule/${id}`
  );

  return response.data;
};

// Admin: Cập nhật Schedule theo ID
export const updateSchedule = async (
  id: number,
  data: UpdateScheduleRequest,
): Promise<ApiResponse<ScheduleResponse>> => {
  const response = await axios.put<ApiResponse<ScheduleResponse>>(
    `/schedule/${id}`,
    data,
  );
  return response.data;
};

// Admin: Xóa Schedule theo ID
export const deleteSchedule = async (
  id: number,
): Promise<ApiResponse<null>> => {
  const response = await axios.delete<ApiResponse<null>>(`/schedule/${id}`);
  return response.data;
};

// Admin: Lấy danh sách học sinh trong schedule
export const getScheduleStudents = async (
  scheduleId: number,
  params?: { search?: string; page?: number; limit?: number },
): Promise<ApiResponse<ScheduleStudentListResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleStudentListResponse>>(
    `/schedule/${scheduleId}/students`,
    { params }
  );
  return response.data;
};

// Admin: Lấy danh sách học sinh hợp lệ để thêm vào schedule
export const getEligibleStudentsForSchedule = async (
  scheduleId: number,
  params?: { search?: string; page?: number; limit?: number },
): Promise<ApiResponse<ScheduleStudentListResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleStudentListResponse>>(
    `/schedule/${scheduleId}/eligible-students`,
    { params }
  );
  return response.data;
};

// Admin: Thêm học sinh vào schedule
export const addStudentToSchedule = async (
  scheduleId: number,
  studentId: number,
): Promise<ApiResponse<unknown>> => {
  const response = await axios.post<ApiResponse<unknown>>(
    `/schedule/${scheduleId}/students`,
    { studentId }
  );
  return response.data;
};

// Admin: Xóa học sinh khỏi schedule
export const removeStudentFromSchedule = async (
  scheduleId: number,
  studentId: number,
): Promise<ApiResponse<unknown>> => {
  const response = await axios.delete<ApiResponse<unknown>>(
    `/schedule/${scheduleId}/students/${studentId}`
  );
  return response.data;
};

// Student: Lấy tất cả schedules đã đăng ký theo courseId
export const getStudentScheduleByCourseId = async (
  courseId: number,
): Promise<ApiResponse<StudentScheduleByIdResponse[]>> => {
  const response = await axios.get<ApiResponse<StudentScheduleByIdResponse[]>>(
    `/schedules/student/course/${courseId}`,
  );
  return response.data;
};

// Student: Lấy danh sách schedules đã đăng ký
export const getStudentSchedules = async (
  page = 1,
  limit = 10,
): Promise<ApiResponse<ScheduleListResponse>> => {
  const response = await axios.get<ApiResponse<ScheduleListResponse>>(
    "/schedule/student/my-schedules",
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const getSchedulesByStudentId = async (
  studentId: number,
  page = 1,
  limit = 10,
): Promise<ApiResponse<StudentSchedulesByStudentIdResponse>> => {
  const response = await axios.get<ApiResponse<StudentSchedulesByStudentIdResponse>>(
    `/schedules/student/${studentId}/schedules`,
    {
      params: { page, limit },
    }
  );

  return response.data;
};