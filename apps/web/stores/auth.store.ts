"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/lib/api/auth.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { SafeUser, LoginPayload, RegisterPayload } from "@vaultkix/types";
import { getErrorMessage } from "@/lib/utils";

interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: SafeUser) => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
}

const setAuthCookie = () => {
  document.cookie = "vaultkix_auth=1; path=/; max-age=604800; SameSite=Lax";
};

const clearAuthCookie = () => {
  document.cookie = "vaultkix_auth=; path=/; max-age=0; SameSite=Lax";
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ── State ──
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Actions ──
      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, refreshToken } =
            await authService.login(payload);
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          setAuthCookie();
          connectSocket(accessToken);

          // Fetch full user — login response is partial
          const user = await authService.getMe();
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false, error: getErrorMessage(err) });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, refreshToken } =
            await authService.register(payload);
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          setAuthCookie();
          connectSocket(accessToken);

          // Fetch full user — register response is partial
          const user = await authService.getMe();
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false, error: getErrorMessage(err) });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // fail silently
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          clearAuthCookie(); // ← add this
          disconnectSocket();
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      // Called on app mount — rehydrates user from stored token
      initAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          clearAuthCookie(); // ← clean up stale cookie if no token
          return;
        }
        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          setAuthCookie(); // ← ensure cookie exists if token is valid
          connectSocket(accessToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          clearAuthCookie(); // ← add this
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "vaultkix-auth",
      // Only persist tokens — user is re-fetched on init
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
