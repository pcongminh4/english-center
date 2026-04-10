import axios, { type AxiosResponse } from "axios";
import type { ApiResponse, ErrorApiResponse } from "../types/api.type";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8081/api",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  withCredentials: true,
  timeout: 40000,
});

instance.interceptors.request.use(
  function (config) {
    // Set Content-Type based on data type, overriding default
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else if (typeof config.data === "object" && config.data !== null) {
      config.headers["Content-Type"] = "application/json";
    }

    const token = sessionStorage.getItem("access_token");
    config.headers.Authorization = token ? `Bearer ${token}` : "";

    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  },
);

// Add a response interceptor
instance.interceptors.response.use(
  function <T>(response: AxiosResponse): AxiosResponse<ApiResponse<T>> {
    response.data = {
      message: response.data.message,
      statusCode: response.status,
      success: response.data.success,
      data: response.data as T,
    };
    return response.data;
  },
  function (error): Promise<unknown> {
    const status = error.response?.status;
    
    // On 401 (token expired/invalid), clear all auth state and redirect to login
    if (status === 401 && !window.location.pathname.includes("/auth/login")) {
      sessionStorage.removeItem("access_token");
      localStorage.removeItem("auth-storage");
      sessionStorage.setItem("session_expired", "true");
      window.location.href = "/auth/login";
    }

    const customError: ErrorApiResponse = {
      ...error.response?.data,
      message: error.response?.data?.message || error.message,
      success: error.response?.data?.success,
      statusCode: error.response?.status,
    };

    return Promise.reject(customError);
  },
);
export default instance;
