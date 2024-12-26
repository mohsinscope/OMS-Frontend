import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/store.js";

const ProtectedRoute = ({ children }) => {
  // Correctly access Zustand store using selector
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const location = useLocation();

  // Debugging: Log the authentication state
  console.log("ProtectedRoute -> isLoggedIn:", isLoggedIn);

  // Redirect to login page if not authenticated
  if (!isLoggedIn) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Render the child components if authenticated
  return children;
};

export default ProtectedRoute;