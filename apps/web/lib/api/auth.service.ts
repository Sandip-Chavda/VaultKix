import { api } from "@/lib/axios";
import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SafeUser,
} from "@vaultkix/types";

type AuthResponseData = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
};

type UserData = { user: SafeUser };
type TokenData = { accessToken: string; refreshToken: string };

type AddressPayload = {
  label: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault?: boolean;
};

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponseData>>(
      "/auth/login",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponseData>>(
      "/auth/register",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async getMe(): Promise<SafeUser> {
    const { data } = await api.get<ApiResponse<UserData>>("/auth/me");
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.user;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem("refreshToken");
    await api.post("/auth/logout", { refreshToken });
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await api.post<ApiResponse<TokenData>>("/auth/refresh", {
      refreshToken,
    });
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async updateProfile(payload: {
    username?: string;
    avatar?: string;
  }): Promise<SafeUser> {
    const { data } = await api.patch<ApiResponse<UserData>>(
      "/auth/profile",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.user;
  },

  async addAddress(payload: AddressPayload): Promise<SafeUser> {
    const { data } = await api.post<ApiResponse<UserData>>(
      "/auth/addresses",
      payload,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.user;
  },

  async deleteAddress(addressId: string): Promise<SafeUser> {
    const { data } = await api.delete<ApiResponse<UserData>>(
      `/auth/addresses/${addressId}`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.user;
  },

  async setDefaultAddress(addressId: string): Promise<SafeUser> {
    const { data } = await api.patch<ApiResponse<UserData>>(
      `/auth/addresses/${addressId}/default`,
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data.user;
  },
};
