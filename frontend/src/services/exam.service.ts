import api from "../configs/axios.config";
import type { ApiResponse } from "../types/api.type";
import type { Exam, PaginatedExamResponse, WritingOneToFive, WritingSixSeven, WritingEight } from "../types/exam/response";
import type {
  CreateExamRequest,
  UpdateExamRequest,
  GetExamRequest,
  UpsertPart3Request,
} from "../types/exam/request";

// ==================== MAIN EXAM ====================

export const getAllExams = async (
  params: GetExamRequest,
): Promise<ApiResponse<PaginatedExamResponse>> => {
  const response = await api.get<ApiResponse<PaginatedExamResponse>>("/writing", {
    params,
  });
  return response.data;
};

export const getExamById = async (id: number): Promise<ApiResponse<Exam>> => {
  const response = await api.get<ApiResponse<Exam>>(`/writing/${id}`);
  return response.data;
};

export const createExam = async (
  data: CreateExamRequest,
): Promise<ApiResponse<Exam>> => {
  const response = await api.post<ApiResponse<Exam>>("/writing", data);
  return response.data;
};

export const updateExam = async (
  data: UpdateExamRequest,
): Promise<ApiResponse<Exam>> => {
  const response = await api.put<ApiResponse<Exam>>(`/writing/${data.id}`, data);
  return response.data;
};

export const deleteExam = async (id: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/writing/${id}`);
  return response.data;
};

export const toggleActiveExam = async (id: number): Promise<ApiResponse<Exam>> => {
  const response = await api.patch<ApiResponse<Exam>>(`/writing/${id}/toggle-active`);
  return response.data;
};

// ==================== PART 1 ====================

export const getPart1 = async (examId: number): Promise<ApiResponse<WritingOneToFive[]>> => {
  const response = await api.get<ApiResponse<WritingOneToFive[]>>(`/writing/${examId}/part1`);
  return response.data;
};

export const upsertPart1 = async (
  examId: number,
  formData: FormData,
): Promise<ApiResponse<WritingOneToFive>> => {
  const response = await api.put<ApiResponse<WritingOneToFive>>(
    `/writing/${examId}/part1`,
    formData,
  );
  return response.data;
};

export const deletePart1 = async (examId: number, index: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/writing/${examId}/part1/${index}`);
  return response.data;
};

// ==================== PART 2 ====================

export const getPart2 = async (examId: number): Promise<ApiResponse<WritingSixSeven[]>> => {
  const response = await api.get<ApiResponse<WritingSixSeven[]>>(`/writing/${examId}/part2`);
  return response.data;
};

export const upsertPart2 = async (
  examId: number,
  formData: FormData,
): Promise<ApiResponse<WritingSixSeven>> => {
  const response = await api.put<ApiResponse<WritingSixSeven>>(
    `/writing/${examId}/part2`,
    formData,
  );
  return response.data;
};

export const deletePart2 = async (examId: number, index: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/writing/${examId}/part2/${index}`);
  return response.data;
};

// ==================== PART 3 ====================

export const getPart3 = async (examId: number): Promise<ApiResponse<WritingEight[]>> => {
  const response = await api.get<ApiResponse<WritingEight[]>>(`/writing/${examId}/part3`);
  return response.data;
};

export const upsertPart3 = async (
  examId: number,
  data: UpsertPart3Request,
): Promise<ApiResponse<WritingEight>> => {
  const response = await api.put<ApiResponse<WritingEight>>(
    `/writing/${examId}/part3`,
    data,
  );
  return response.data;
};

export const deletePart3 = async (examId: number, index: number): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/writing/${examId}/part3/${index}`);
  return response.data;
};