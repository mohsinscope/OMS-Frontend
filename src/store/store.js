import { create } from "zustand"; // Zustand for state management
import { persist } from "zustand/middleware"; // Middleware to persist state in localStorage

/**
 * useAuthStore
 * Zustand store to manage user authentication state and sidebar state.
 */
const useAuthStore = create(
  persist(
    (set) => ({
      // User authentication state
      user: null, // Stores the logged-in user's details
      isLoggedIn: false, // Tracks the login status
      error: "", // Holds error messages during login

      // Sidebar state
      isSidebarCollapsed: false, // Tracks whether the sidebar is collapsed or expanded

      /**
       * login function
       * Authenticates the user by checking their credentials.
       *
       * @param {string} username - Username entered by the user.
       * @param {string} password - Password entered by the user.
       * @param {Array} users - List of valid users for authentication.
       */
      login: (username, password, users) => {
        // Find the user matching the provided username and password
        const user = users.find(
          (u) => u.username === username && u.password === password
        );

        if (user) {
          // Successful login: update state with user details
          set({ user, isLoggedIn: true, error: "" });
        } else {
          // Failed login: set error message and reset user state
          set({
            error: "اسم المستخدم أو كلمة المرور غير صحيحة", // Error: Invalid credentials
            user: null,
            isLoggedIn: false,
          });
        }
      },

      /**
       * logout function
       * Logs the user out by clearing user state and error messages.
       */
      logout: () => {
        set({ user: null, isLoggedIn: false, error: "" });
      },

      /**
       * initialize function
       * Validates the persisted state in localStorage and restores it.
       */
      initialize: () => {
        // Retrieve the persisted state from localStorage
        const storedUser = JSON.parse(localStorage.getItem("auth-storage"));
        if (storedUser && storedUser.state.isLoggedIn) {
          // If valid state exists, restore user information and login status
          set({
            user: storedUser.state.user,
            isLoggedIn: true,
            error: "",
          });
        } else {
          // Otherwise, reset user state to default
          set({ user: null, isLoggedIn: false, error: "" });
        }
      },

      /**
       * Sidebar state management
       */
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set(() => ({ isSidebarCollapsed: collapsed })),
    }),
    { name: "auth-storage" } // Persist only authentication state with the key 'auth-storage' in localStorage
  )
);

export default useAuthStore;
