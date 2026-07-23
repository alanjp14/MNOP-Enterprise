import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchApi } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  organization: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (token, user) => {
        localStorage.setItem("mnop_access_token", token);
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("mnop_access_token");
        set({ token: null, user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;
        
        set({ isLoading: true });
        try {
          // Fetch current user from backend
          const user = await fetchApi<UserProfile>("/auth/me");
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // If token is invalid or expired
          console.error("Failed to fetch profile:", error);
          localStorage.removeItem("mnop_access_token");
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }), // Only persist token
      onRehydrateStorage: () => (state) => {
        // Ensure localStorage is synced
        if (state?.token) {
          localStorage.setItem("mnop_access_token", state.token);
        }
      }
    }
  )
);
