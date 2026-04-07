import { RoleName } from "../../types/Role";

export interface CreateUserRequest {
  phone: string;
  fullname: string;
  email: string;
  password: string;
  role: RoleName;
}
export interface GetUserRequest {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UpdateUserRequest {
  phone?: string;
  fullname?: string;
  email?: string;
  password?: string;
}
