import { create } from "zustand"; // Zustand for state management
import { persist } from "zustand/middleware"; // Middleware to persist state in localStorage

/**
 * useAuthStore
 * Zustand store to manage user authentication state, access token, and sidebar state.
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // User authentication state
      user: null, // Stores the logged-in user's details
      isLoggedIn: false, // Tracks the login status
      error: "", // Holds error messages during login

      // Access token state
      accessToken: null, // Stores the user's access token for API authentication

      // Sidebar state
      isSidebarCollapsed: false, // Tracks whether the sidebar is collapsed or expanded

      /**
       * login function
       * Authenticates the user by checking their credentials and saves the Bearer token.
       *
       * @param {string} username - Username entered by the user.
       * @param {string} password - Password entered by the user.
       * @param {Function} fetchToken - Function to fetch access token from the server.
       */
      login: async (username, password, fetchToken) => {
        try {
          // Fetch the access token from the server
          const response = await fetchToken(username, password);

          // Save user details and token in the global state
          const { token, user } = response; // Assuming response includes 'token' and 'user'
          set({
            user, // Save user details
            isLoggedIn: true,
            accessToken: token, // Save the Bearer token
            error: "",
          });
        } catch (err) {
          // Handle errors during token retrieval
          console.error("Error fetching access token:", err);
          set({
            error: "فشل في الحصول على رمز الدخول. يرجى المحاولة لاحقًا.", // Error: Token fetch failed
            user: null,
            isLoggedIn: false,
            accessToken: null,
          });
        }
      },

      /**
       * logout function
       * Logs the user out by clearing user state, Bearer token, and error messages.
       */
      logout: () => {
        set({
          user: null,
          isLoggedIn: false,
          error: "",
          accessToken: null, // Clear the token on logout
        });
      },

      /**
       * initialize function
       * Validates the persisted state in localStorage and restores it, including the Bearer token.
       */
      initialize: () => {
        // Retrieve the persisted state from localStorage
        const storedAuth = JSON.parse(localStorage.getItem("auth-storage"));
        if (storedAuth && storedAuth.state.isLoggedIn) {
          // If valid state exists, restore user information and login status
          set({
            user: storedAuth.state.user,
            isLoggedIn: true,
            accessToken: storedAuth.state.accessToken,
            error: "",
          });
        } else {
          // Otherwise, reset user state to default
          set({
            user: null,
            isLoggedIn: false,
            accessToken: null,
            error: "",
          });
        }
      },

      /**
       * getAuthHeader function
       * Retrieves the Bearer token as an Authorization header for API calls.
       *
       * @returns {Object} The Authorization header with Bearer token or an empty object if not available.
       */
      getAuthHeader: () => {
        const token = get().accessToken;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      /**
       * Sidebar state management
       */
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set(() => ({ isSidebarCollapsed: collapsed })),
    }),
    { name: "auth-storage" } // Persist the authentication state with the key 'auth-storage' in localStorage
  )
);

export default useAuthStore;
