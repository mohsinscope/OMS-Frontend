import React from "react";
import { Navigate } from "react-router-dom"; // For navigation and redirects
import useAuthStore from "../store/store.js"; // Authentication state management

/**
 * ProtectedRoute Component
 * Ensures that only authenticated users can access the wrapped children components.
 * If the user is not logged in, they are redirected to the login page.
 *
 * @param {ReactNode} children - The child components or pages to render if authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore(); // Get the logged-in state from the authentication store

  // If the user is not logged in, redirect them to the login page
  if (!isLoggedIn) {
    return <Navigate to="/" replace />; // Redirect to the root (login) route
  }

  // If authenticated, render the children components
  return children;
};

export default ProtectedRoute;
