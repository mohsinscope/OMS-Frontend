import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null, // Stores the logged-in user's information
  profile: null, // Stores the logged-in user's profile
  isLoggedIn: false, // Tracks the user's login status
  accessToken: null, // Stores the JWT token
  isSidebarCollapsed: false, // Tracks the state of the sidebar
  searchVisible: false, // Tracks search visibility

  // Initialize the store from localStorage on app load
  initializeAuth: () => {
    const token = localStorage.getItem("accessToken");
    const userProfile = localStorage.getItem("userProfile");

    if (token && userProfile) {
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
          profile: JSON.parse(userProfile), // Ensure profile is parsed from localStorage
          isLoggedIn: true,
          accessToken: token,
        });
      } catch (error) {
        console.error("Failed to decode token or load user profile:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userProfile");
      }
    }
  },

  // Toggle sidebar state
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  // Login function to set user and token in state and localStorage
  login: (token, userProfile) => {
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

      localStorage.setItem("accessToken", token); // Save token to localStorage
      localStorage.setItem("userProfile", JSON.stringify(parsedProfile)); // Save user profile to localStorage

      set({
        user: {
          id: payload.nameid || null,
          username: payload.unique_name || "Guest",
          role: payload.role || "Unknown Role",
        },
        profile: parsedProfile, // Include additional user profile data
        isLoggedIn: true,
        accessToken: token,
      });
    } catch (error) {
      console.error("Failed to decode token or save user data:", error);
      set({
        user: null,
        profile: null,
        isLoggedIn: false,
        accessToken: null,
      });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userProfile");
    }
  },

  // Logout function to clear user data and token
  logout: () => {
    localStorage.removeItem("accessToken"); // Clear token from localStorage
    localStorage.removeItem("userProfile"); // Clear user profile from localStorage
    set({
      user: null,
      profile: null,
      isLoggedIn: false,
      accessToken: null,
    });
  },

  // Toggle search visibility
  toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),
}));

export default useAuthStore;
