import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null, // Stores the logged-in user's information
  isLoggedIn: false, // Tracks the user's login status
  accessToken: null, // Stores the JWT token
  isSidebarCollapsed: false, // Tracks the state of the sidebar
  searchVisible: false, // Tracks search visibility

  // Initialize the store from localStorage on app load
  initializeAuth: () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64)); // Decode the token payload

        set({
          user: {
            id: payload.nameid || null, // User ID from the token
            username: payload.unique_name || "Guest", // Username
            role: payload.role || "Unknown Role", // Role
          },
          isLoggedIn: true,
          accessToken: token,
        });
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("accessToken"); // Remove invalid token
      }
    }
  },

  // Toggle sidebar state
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  // Login function to set user and token in state and localStorage
  login: (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64)); // Decode the token payload

      localStorage.setItem("accessToken", token); // Save token to localStorage

      set({
        user: {
          id: payload.nameid || null,
          username: payload.unique_name || "Guest",
          role: payload.role || "Unknown Role",
        },
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
      localStorage.removeItem("accessToken");
    }
  },

  // Logout function to clear user data and token
  logout: () => {
    localStorage.removeItem("accessToken"); // Clear token from localStorage
    set({
      user: null,
      isLoggedIn: false,
      accessToken: null,
    });
  },

  // Toggle search visibility
  toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),
}));

export default useAuthStore;
