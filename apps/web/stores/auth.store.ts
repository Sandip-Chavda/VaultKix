"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/lib/api/auth.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { SafeUser, LoginPayload, RegisterPayload } from "@vaultkix/types";

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
          const { user, accessToken, refreshToken } =
            await authService.login(payload);

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);

          connectSocket(accessToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Login failed",
          });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken, refreshToken } =
            await authService.register(payload);

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);

          connectSocket(accessToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Registration failed",
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // fail silently — always clear local state
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
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
        if (!accessToken) return;

        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          connectSocket(accessToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          // Token is stale — clear everything
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
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
