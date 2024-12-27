import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/store.js";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, [initializeAuth]);

  // Show nothing while initializing
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  // Redirect to login page if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Render the child components if authenticated
  return children;
};

export default ProtectedRoute;