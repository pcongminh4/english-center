import axios from "../configs/axios.config";
import type { ApiResponse } from "../types/api.type";
import type {
  CreateTeacherRequest,
  UpdateTeacherRequest,
  GetTeacherRequest,
} from "../types/teacher/request";
import type { TeacherResponse, TeacherListResponse } from "../types/teacher/response";

export const getAllTeachersService = async (
  params?: GetTeacherRequest
): Promise<ApiResponse<TeacherListResponse>> => {
  const URL_API = "/teachers";
  const res = await axios.get(URL_API, { params });
  return res.data;
};

export const getTeacherByIdService = async (
  id: number
): Promise<ApiResponse<TeacherResponse>> => {
  const URL_API = `/teachers/${id}`;
  const res = await axios.get(URL_API);
  return res.data;
};

export const getTeacherMeService = async (): Promise<ApiResponse<TeacherResponse>> => {
  const URL_API = "/teachers/me";
  const res = await axios.get(URL_API);
  return res.data;
};

export const createTeacherService = async (
  data: CreateTeacherRequest
): Promise<ApiResponse<TeacherResponse>> => {
  const URL_API = "/teachers";
  const formData = new FormData();
  
  formData.append("phone", data.phone);
  formData.append("fullname", data.fullname);
  formData.append("email", data.email);
  formData.append("password", data.password);
  formData.append("degree", data.degree);
  formData.append("isTeaching", String(data.isTeaching));
  formData.append("avatar", data.avatar);

  const res = await axios.post(URL_API, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateTeacherService = async (
  id: number,
  data: UpdateTeacherRequest
): Promise<ApiResponse<TeacherResponse>> => {
  const URL_API = `/teachers/${id}`;
  const formData = new FormData();

  if (data.phone) formData.append("phone", data.phone);
  if (data.fullname) formData.append("fullname", data.fullname);
  if (data.email) formData.append("email", data.email);
  if (data.password) formData.append("password", data.password);
  if (data.degree) formData.append("degree", data.degree);
  if (data.isTeaching !== undefined) formData.append("isTeaching", String(data.isTeaching));
  if (data.avatar) formData.append("avatar", data.avatar);

  const res = await axios.put(URL_API, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateTeacherMeService = async (
  data: UpdateTeacherRequest
): Promise<ApiResponse<TeacherResponse>> => {
  const URL_API = "/teachers/me";
  const formData = new FormData();

  if (data.phone) formData.append("phone", data.phone);
  if (data.fullname) formData.append("fullname", data.fullname);
  if (data.email) formData.append("email", data.email);
  if (data.password) formData.append("password", data.password);
  if (data.degree) formData.append("degree", data.degree);
  if (data.isTeaching !== undefined) formData.append("isTeaching", String(data.isTeaching));
  if (data.avatar) formData.append("avatar", data.avatar);

  const res = await axios.put(URL_API, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const deleteTeacherService = async (
  id: number
): Promise<ApiResponse<null>> => {
  const URL_API = `/teachers/${id}`;
  const res = await axios.delete(URL_API);
  return res.data;
};
