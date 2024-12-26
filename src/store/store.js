import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null, // Stores the logged-in user's information
  profile: null, // Stores the logged-in user's profile
  roles: [], // Stores the user's roles from backend (extracted from token)
  permissions: {}, // Stores the user's permissions for resources
  isLoggedIn: false, // Tracks the user's login status
  accessToken: null, // Stores the JWT token
  isSidebarCollapsed: false, // Tracks the state of the sidebar
  searchVisible: false, // Tracks search visibility

  // Initialize the store from localStorage on app load
  initializeAuth: () => {
    const token = localStorage.getItem("accessToken");
    const userProfile = localStorage.getItem("userProfile");
    const permissions = localStorage.getItem("permissions");

    if (token && userProfile) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64)); // Decode the token payload
        const parsedProfile = JSON.parse(userProfile);

        // Ensure roles is an array extracted from `role` in the token
        const roles = Array.isArray(payload.role) ? payload.role : [payload.role];

        console.log("Roles from token (initializeAuth):", roles);

        set({
          user: {
            id: payload.nameid || null, // User ID from the token
            username: payload.unique_name || "Guest", // Username
          },
          profile: parsedProfile, // Ensure profile is parsed from localStorage
          roles, // Store roles from the token
          permissions: permissions ? JSON.parse(permissions) : {}, // Parse permissions or set default
          isLoggedIn: true,
          accessToken: token,
        });
      } catch (error) {
        console.error("Failed to decode token or load user profile:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userProfile");
        localStorage.removeItem("permissions");
      }
    }
  },

  // Toggle sidebar state
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  // Login function to set user, roles, permissions, and token in state and localStorage
  login: (token, userProfile, permissions) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64)); // Decode the token payload

      const parsedProfile = {
        ...userProfile,
        governorateId: userProfile.governorateId || null,
        governorateName: userProfile.governorateName || "غير معروف",
        officeId: userProfile.officeId || null,
        officeName: userProfile.officeName || "غير معروف",
      };

      // Ensure roles is an array extracted from `role` in the token
      const roles = Array.isArray(payload.role) ? payload.role : [payload.role];

      console.log("Roles from token (login):", roles);

      localStorage.setItem("accessToken", token); // Save token to localStorage
      localStorage.setItem("userProfile", JSON.stringify(parsedProfile)); // Save user profile to localStorage
      localStorage.setItem("permissions", JSON.stringify(permissions)); // Save permissions to localStorage

      set({
        user: {
          id: payload.nameid || null,
          username: payload.unique_name || "Guest",
        },
        profile: parsedProfile, // Include additional user profile data
        roles, // Store roles from the token
        permissions,
        isLoggedIn: true,
        accessToken: token,
      });
    } catch (error) {
      console.error("Failed to decode token or save user data:", error);
      set({
        user: null,
        profile: null,
        roles: [],
        permissions: {},
        isLoggedIn: false,
        accessToken: null,
      });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("permissions");
    }
  },

  // Logout function to clear user data and token
  logout: () => {
    localStorage.removeItem("accessToken"); // Clear token from localStorage
    localStorage.removeItem("userProfile"); // Clear user profile from localStorage
    localStorage.removeItem("permissions"); // Clear permissions from localStorage
    set({
      user: null,
      profile: null,
      roles: [],
      permissions: {},
      isLoggedIn: false,
      accessToken: null,
    });
  },

  // Toggle search visibility
  toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),
}));

export default useAuthStore;
