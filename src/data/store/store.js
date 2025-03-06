// store/authStore.js
import { create } from "zustand";

const parseToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Token parsing error:", error);
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  roles: [],
  permissions: {},
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
  isRefreshing: false,
  searchVisible: true,
  isSidebarCollapsed: false,

  toggleSidebar: () => {
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed
    }));
  },

  initializeAuth: async () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userProfileStr = localStorage.getItem("userProfile");

    if (!accessToken || !refreshToken || !userProfileStr) {
      set({ isInitialized: true });
      return;
    }

    try {
      const tokenPayload = parseToken(accessToken);
      const userProfile = JSON.parse(userProfileStr);
      const roles = Array.isArray(tokenPayload.role) ? tokenPayload.role : [tokenPayload.role];

      set({
        user: {
          id: tokenPayload.nameid || null,
          username: tokenPayload.unique_name || "Guest",
        },
        profile: userProfile,
        roles,
        permissions: tokenPayload.Permission || [],
        isLoggedIn: true,
        accessToken,
        refreshToken,
        isInitialized: true,
      });
    } catch (error) {
      console.error("[Auth] Initialization failed:", error);
      set({ isInitialized: true });
    }
  },

  login: async (accessToken, refreshToken, userProfile) => {
    try {
      const tokenPayload = parseToken(accessToken);

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      set({
        user: {
          id: tokenPayload.nameid || null,
          username: tokenPayload.unique_name || "Guest",
        },
        profile: userProfile,
        roles: Array.isArray(tokenPayload.role) ? tokenPayload.role : [tokenPayload.role],
        permissions: tokenPayload.Permission || [],
        isLoggedIn: true,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      throw error;
    }
  },
  updateTokens: async (accessToken, refreshToken) => {
    try {
      const tokenPayload = parseToken(accessToken);
      
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      
      set({
        accessToken,
        refreshToken,
        isRefreshing: false,
        user: {
          id: tokenPayload.nameid || null,
          username: tokenPayload.unique_name || "Guest",
        },
        roles: Array.isArray(tokenPayload.role) ? tokenPayload.role : [tokenPayload.role],
        permissions: tokenPayload.Permission || [],
        isLoggedIn: true,
      });
    } catch (error) {
      console.error("[Auth Store] Failed to update tokens:", error);
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userProfile");

    set({
      user: null,
      profile: null,
      roles: [],
      permissions: {},
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
    });

    window.location.href = '/login';
  },
}));

export default useAuthStore;