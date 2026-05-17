import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "@/config/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const createHttp = (baseURL: string = env.apiBaseUrl): AxiosInstance => {
  const instance = axios.create({ baseURL, withCredentials: false });

  instance.interceptors.response.use(
    (r) => r,
    (error: AxiosError<{ error?: string; detail?: string }>) => {
      const status = error.response?.status ?? 0;
      const code = error.response?.data?.error ?? error.code ?? "UNKNOWN";
      const message =
        error.response?.data?.detail ?? error.message ?? "request failed";
      return Promise.reject(new ApiError(status, code, message));
    },
  );

  return instance;
};

// Default singleton — features import this. Tests can build their own.
export const http = createHttp();
