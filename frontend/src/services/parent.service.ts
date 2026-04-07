import axios from "../configs/axios.config";
import type { ApiResponse } from "../types/api.type";
import type {
  CreateParentRequest,
  UpdateParentRequest,
  GetParentRequest,
} from "../types/parent/request";
import type { ParentResponse, ParentListResponse } from "../types/parent/response";

export const getAllParentsService = async (
  params?: GetParentRequest
): Promise<ApiResponse<ParentListResponse>> => {
  const URL_API = "/parents";
  const res = await axios.get(URL_API, { params });
  return res.data;
};

export const getParentByIdService = async (
  id: number
): Promise<ApiResponse<ParentResponse>> => {
  const URL_API = `/parents/${id}`;
  const res = await axios.get(URL_API);
  return res.data;
};

export const getParentMeService = async (): Promise<ApiResponse<ParentResponse>> => {
  const URL_API = "/parents/me";
  const res = await axios.get(URL_API);
  return res.data;
};

export const createParentService = async (
  data: CreateParentRequest
): Promise<ApiResponse<ParentResponse>> => {
  const URL_API = "/parents";
  const res = await axios.post(URL_API, data);
  return res.data;
};

export const updateParentService = async (
  id: number,
  data: UpdateParentRequest
): Promise<ApiResponse<ParentResponse>> => {
  const URL_API = `/parents/${id}`;
  const res = await axios.put(URL_API, data);
  return res.data;
};

export const updateParentMeService = async (
  data: UpdateParentRequest
): Promise<ApiResponse<ParentResponse>> => {
  const URL_API = "/parents/me";
  const res = await axios.put(URL_API, data);
  return res.data;
};

export const deleteParentService = async (
  id: number
): Promise<ApiResponse<null>> => {
  const URL_API = `/parents/${id}`;
  const res = await axios.delete(URL_API);
  return res.data;
};

export const linkStudentToParentService = async (
  parentId: number,
  studentId: number
): Promise<ApiResponse<null>> => {
  const URL_API = `/parents/${parentId}/students/${studentId}`;
  const res = await axios.post(URL_API);
  return res.data;
};

export const unlinkStudentFromParentService = async (
  parentId: number,
  studentId: number
): Promise<ApiResponse<null>> => {
  const URL_API = `/parents/${parentId}/students/${studentId}`;
  const res = await axios.delete(URL_API);
  return res.data;
};
