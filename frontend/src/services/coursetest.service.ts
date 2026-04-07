import api from "../configs/axios.config";
import type { ApiResponse } from "../types/api.type";
import type {
  CourseTest,
  PaginatedCourseTestResponse,
  CourseTestDetail,
} from "../types/coursetest/response";
import type {
  CreateCourseTestRequest,
  UpdateCourseTestRequest,
} from "../types/coursetest/request";

// Service
export const getCourseTestsByCourseId = async (
  courseId: number,
): Promise<ApiResponse<PaginatedCourseTestResponse>> => {
  const response = await api.get<ApiResponse<PaginatedCourseTestResponse>>(
    `/course-tests/course/${courseId}`,
  );
  return response.data;
};

export const createCoursetest = async (
  data: CreateCourseTestRequest | FormData,
): Promise<ApiResponse<CourseTest>> => {
  const response = await api.post<ApiResponse<CourseTest>>(
    "/course-tests",
    data,
    {
      headers: {
        "Content-Type":
          data instanceof FormData ? "multipart/form-data" : "application/json",
      },
    },
  );
  return response.data;
};

export const getCoursetestById = async (
  id: number,
): Promise<ApiResponse<CourseTestDetail>> => {
  const response = await api.get<ApiResponse<CourseTestDetail>>(
    `/course-tests/${id}`,
  );
  return response.data;
};

export const updateCoursetest = async (
  data: UpdateCourseTestRequest,
): Promise<ApiResponse<CourseTest>> => {
  const response = await api.put<ApiResponse<CourseTest>>(
    `/course-tests/${data.id}`,
    data,
  );
  return response.data;
};

export const deleteCoursetest = async (
  id: number,
): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/course-tests/${id}`);
  return response.data;
};
