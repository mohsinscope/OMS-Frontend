import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null, // Stores the logged-in user's info
  isLoggedIn: false, // Tracks the login status
  error: "", // Error messages

  // Login function
  login: (username, password, users) => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      set({ user, isLoggedIn: true, error: "" }); // Successful login
    } else {
      set({ error: "كلمة السر او اسم المستخدم خطأ", user: null, isLoggedIn: false }); // Login failed
    }
  },

  // Logout function
  logout: () => set({ user: null, isLoggedIn: false, error: "" }),
}));

export default useAuthStore;
