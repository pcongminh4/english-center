import axiosInstance from '../configs/axios.config';
import type { ApiResponse } from '../types/api.type';
import type { CreateStudentRequest, GetStudentRequest, UpdateStudentRequest } from '../types/student/request';
import type { StudentListResponse, StudentResponse } from '../types/student/response';

export const getAllStudentsService = async (
  params?: GetStudentRequest
): Promise<ApiResponse<StudentListResponse>> => {
  const URL_API = "/students";
  const res = await axiosInstance.get(URL_API, { params });
  return res.data;
};

export const getStudentByIdService = async (
  id: number
): Promise<ApiResponse<StudentResponse>> => {
  const URL_API = `/students/${id}`;
  const res = await axiosInstance.get(URL_API);
  return res.data;
};

export const createStudentService = async (
  data: CreateStudentRequest
): Promise<ApiResponse<StudentResponse>> => {
  const URL_API = "/students";
  const res = await axiosInstance.post(URL_API, data);
  return res.data;
};

export const updateStudentService = async (
  id: number,
  data: UpdateStudentRequest
): Promise<ApiResponse<StudentResponse>> => {
  const URL_API = `/students/${id}`;
  const res = await axiosInstance.put(URL_API, data);
  return res.data;
};

export const deleteStudentService = async (
  id: number
): Promise<ApiResponse<null>> => {
  const URL_API = `/students/${id}`;
  const res = await axiosInstance.delete(URL_API);
  return res.data;
};

export const getStudentMeService = async (): Promise<ApiResponse<StudentResponse>> => {
  const res = await axiosInstance.get('/students/me');
  return res.data;
};

export const getStudentParentsService = async (): Promise<ApiResponse<any[]>> => {
  const res = await axiosInstance.get('/students/me/parents');
  return res.data;
};

export const getStudentCoursesService = async (): Promise<ApiResponse<any[]>> => {
  const res = await axiosInstance.get('/students/me/courses');
  return res.data;
};

export const getStudentsByParentMeService = async (): Promise<ApiResponse<StudentResponse[]>> => {
  const res = await axiosInstance.get('/students/by-parent/me');
  return res.data;
};