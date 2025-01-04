import { create } from "zustand";
import axios from "axios";
import BASE_URL from "./url.js";

// Constants
const TOKEN_REFRESH_INTERVAL = 90 * 1000; // 1.5 minutes
const MAX_REFRESH_RETRIES = 3;

// Cache variables
let tokenRefreshTimer = null;
let refreshRetryCount = 0;

// Helper to parse JWT
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

// Zustand store
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

  // Refresh the access token
  refreshAccessToken: async () => {
    console.log("[Token Refresh] Attempting token refresh...");
    if (get().isRefreshing) {
      console.log("[Token Refresh] Already in progress");
      return get().accessToken;
    }

    set({ isRefreshing: true });

    try {
      const currentAccessToken = localStorage.getItem("accessToken");
      const currentRefreshToken = localStorage.getItem("refreshToken");

      if (!currentAccessToken || !currentRefreshToken) {
        console.error("[Token Refresh] Missing tokens for refresh");
        throw new Error("Missing tokens");
      }

      console.log("[Token Refresh] Sending request to refresh token...");
      const response = await axios.post(`${BASE_URL}/api/account/refresh-token`, {
        AccessToken: currentAccessToken,
        RefreshToken: currentRefreshToken,
      });

      const { accessToken, refreshToken } = response.data;

      if (!accessToken || !refreshToken) {
        console.error("[Token Refresh] Invalid response from server", response.data);
        throw new Error("Invalid token response");
      }

      console.log("[Token Refresh] Successfully refreshed tokens");

      // Reset retry count
      refreshRetryCount = 0;

      // Update storage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Update store
      set({
        accessToken,
        refreshToken,
        isRefreshing: false,
      });

      return accessToken;
    } catch (error) {
      console.error("[Token Refresh] Failed:", error);

      // Retry logic
      if (refreshRetryCount < MAX_REFRESH_RETRIES) {
        refreshRetryCount++;
        console.log(`[Token Refresh] Retrying (${refreshRetryCount}/${MAX_REFRESH_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * refreshRetryCount));
        return await get().refreshAccessToken();
      }

      console.warn("[Token Refresh] Maximum retries reached");
      set({ isRefreshing: false });

      // Do not log out, allow user to continue without refreshing
      return null;
    }
  },

  // Start token refresh timer
  startTokenRefreshTimer: () => {
    console.log("[Token Timer] Starting refresh timer...");
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
    }

    tokenRefreshTimer = setInterval(async () => {
      console.log("[Token Timer] Triggering token refresh...");
      try {
        await get().refreshAccessToken();
      } catch (error) {
        console.error("[Token Timer] Token refresh failed:", error);
      }
    }, TOKEN_REFRESH_INTERVAL);

    console.log("[Token Timer] Refresh timer started");
  },

  // Stop token refresh timer
  stopTokenRefreshTimer: () => {
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
      tokenRefreshTimer = null;
      console.log("[Token Timer] Refresh timer stopped");
    }
  },

  // Initialize authentication
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

      console.log("[Auth] Initialization successful, starting refresh timer...");
      get().startTokenRefreshTimer();
    } catch (error) {
      console.error("[Auth] Initialization failed:", error);
      set({ isInitialized: true });
    }
  },

  // Handle login
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

      console.log("[Auth] Login successful, starting refresh timer...");
      get().startTokenRefreshTimer();
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      throw error;
    }
  },

  // Handle logout
  logout: () => {
    get().stopTokenRefreshTimer();

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

    console.log("[Auth] User logged out");
  },
}));

export default useAuthStore;
