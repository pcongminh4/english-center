import axios from "../configs/axios.config";
import type { ApiResponse } from "../types/api.type";
import type { UpdateUserRequest } from "../types/user/request";
import type { UserResponse } from "../types/user/response";

export const getUserMeService = async (): Promise<ApiResponse<UserResponse>> => {
  const URL_API = "/user/me";
  const res = await axios.get(URL_API);
  return res.data;
};

export const updateUserMeService = async (
  data: UpdateUserRequest
): Promise<ApiResponse<UserResponse>> => {
  const URL_API = "/user/me";
  const res = await axios.put(URL_API, data);
  return res.data;
};
