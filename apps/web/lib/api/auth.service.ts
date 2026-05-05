import { api } from "@/lib/axios";
import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SafeUser,
} from "@vaultkix/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async getMe(): Promise<SafeUser> {
    const { data } = await api.get<ApiResponse<SafeUser>>("/auth/me");
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const { data } = await api.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh",
      { refreshToken },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async updateProfile(payload: {
    username?: string;
    avatar?: string;
  }): Promise<SafeUser> {
    const { data } = await api.patch<ApiResponse<SafeUser>>(
      "/auth/profile",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },
};
