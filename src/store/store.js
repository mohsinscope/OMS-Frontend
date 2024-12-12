import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  accessToken: null,
  isSidebarCollapsed: false, // Sidebar state
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })), // Toggle sidebar

  login: (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      set({
        user: { username: payload.unique_name, role: payload.role || "Unknown Role" },
        isLoggedIn: true,
        accessToken: token,
      });
    } catch (error) {
      console.error("Failed to decode token:", error);
      set({
        user: null,
        isLoggedIn: false,
        accessToken: null,
      });
    }
  },

  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
      accessToken: null,
    });
  },
}));

export default useAuthStore;
