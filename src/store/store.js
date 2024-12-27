import { create } from "zustand";

const useAuthStore = create((set) => ({
<<<<<<< HEAD
  user: null,
  profile: null,
  roles: [],
  permissions: {},
  isLoggedIn: false,
  accessToken: null,
  isSidebarCollapsed: false,
  searchVisible: false,
  isInitialized: false,
=======
  user: null, // Stores the logged-in user's information
  profile: null, // Stores the logged-in user's profile
  roles: [], // Stores the user's roles from backend (extracted from token)
  permissions: {}, // Stores the user's permissions for resources
  isLoggedIn: false, // Tracks the user's login status
  accessToken: null, // Stores the JWT token
  isSidebarCollapsed: false, // Tracks the state of the sidebar
  searchVisible: true, // Tracks search visibility
>>>>>>> 9a20a5b456a1b521457140a142fff6b92c96e400

  initializeAuth: async () => {
    const token = localStorage.getItem("accessToken");
    const userProfile = localStorage.getItem("userProfile");
    const permissions = localStorage.getItem("permissions");

    if (token && userProfile) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));

        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userProfile");
          localStorage.removeItem("permissions");
          set({ isInitialized: true });
          return;
        }

        const parsedProfile = JSON.parse(userProfile);
<<<<<<< HEAD
        const roles = Array.isArray(payload.role) ? payload.role : [payload.role];
=======

        // Ensure roles is an array extracted from `role` in the token
        const roles = Array.isArray(payload.role)
          ? payload.role
          : [payload.role];
>>>>>>> 9a20a5b456a1b521457140a142fff6b92c96e400

        set({
          user: {
            id: payload.nameid || null,
            username: payload.unique_name || "Guest",
          },
          profile: parsedProfile,
          roles,
          permissions: permissions ? JSON.parse(permissions) : {},
          isLoggedIn: true,
          accessToken: token,
          isInitialized: true
        });
      } catch (error) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userProfile");
        localStorage.removeItem("permissions");
        set({ isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  login: (token, userProfile, permissions) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      const parsedProfile = {
        ...userProfile,
        governorateId: userProfile.governorateId || null,
        governorateName: userProfile.governorateName || "غير معروف",
        officeId: userProfile.officeId || null,
        officeName: userProfile.officeName || "غير معروف",
      };

      const roles = Array.isArray(payload.role) ? payload.role : [payload.role];

      localStorage.setItem("accessToken", token);
      localStorage.setItem("userProfile", JSON.stringify(parsedProfile));
      localStorage.setItem("permissions", JSON.stringify(permissions));

      set({
        user: {
          id: payload.nameid || null,
          username: payload.unique_name || "Guest",
        },
        profile: parsedProfile,
        roles,
        permissions,
        isLoggedIn: true,
        accessToken: token,
      });
    } catch (error) {
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

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("permissions");
    set({
      user: null,
      profile: null,
      roles: [],
      permissions: {},
      isLoggedIn: false,
      accessToken: null,
    });
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  toggleSearch: () => set((state) => ({ searchVisible: !state.searchVisible })),
}));

export default useAuthStore;