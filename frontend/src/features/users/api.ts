// Thin module-scoped API — each feature owns its endpoint contracts.
// Use the validated schemas so server drift surfaces in dev instead of UI bugs.
import { http } from "@/shared/api/http";
import {
  tokenResponseSchema,
  userSchema,
  type TokenResponse,
  type User,
} from "@/features/users/types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const usersApi = {
  register: async (payload: RegisterPayload): Promise<User> => {
    const { data } = await http.post("/users", payload);
    return userSchema.parse(data);
  },
  me: async (): Promise<User> => {
    const { data } = await http.get("/users/me");
    return userSchema.parse(data);
  },
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const { data } = await http.post("/auth/login", payload);
    return tokenResponseSchema.parse(data);
  },
};
