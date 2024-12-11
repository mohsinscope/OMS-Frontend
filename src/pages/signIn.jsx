import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import TextFieldForm from "./../reusable elements/ReuseAbleTextField.jsx"; // Reusable form component
import "./signIn.css"; // Custom CSS for styling
import Logo from "../assets/Asset 2.png"; // Company logo
import useAuthStore from "./../store/store.js"; // Authentication store for managing user state
import axios from "axios"; // Import axios for API requests

const SignInPage = () => {
  const navigate = useNavigate(); // React Router hook for navigation
  const formRef = useRef(null); // Ref to access the form data
  const [loginError, setLoginError] = useState(""); // State to track login errors

  // Access login functionality and state from the authentication store
  const { login, error, isLoggedIn, setAccessToken } = useAuthStore();

  // Define form fields for the login form
  const fields = [
    { name: "username", placeholder: "اسم المستخدم", type: "text" },
    { name: "password", placeholder: "كلمة السر", type: "password" },
  ];

  // Function to navigate to the dashboard if logged in
  const navigateToDashboard = useCallback(() => {
    if (window.location.pathname !== "/dashboard") {
      navigate("/dashboard"); // Redirect to the dashboard route
    }
  }, [navigate]);

  // Effect to check if the user is logged in and redirect to the dashboard
  useEffect(() => {
    if (isLoggedIn) {
      navigateToDashboard();
    }
  }, [isLoggedIn, navigateToDashboard]);

  // Effect to update the error message when the store's error state changes
  useEffect(() => {
    setLoginError(error);
  }, [error]);

  // Function to handle form submission
  const handleSubmit = async () => {
    if (formRef.current) {
      const formData = formRef.current.getFormData(); // Get form data
      const { username, password } = formData;

      // Validate if the username and password are entered
      if (!username || !password) {
        setLoginError("يرجى إدخال اسم المستخدم وكلمة السر"); // Show an error message
        return;
      }

      try {
        // Call the API to authenticate and get the JWT token
        const response = await axios.post(
          "http://localhost:5214/api/account/login",
          {
            username,
            password,
          }
        );

        // Assuming the response includes the JWT and user data
        const { token, user } = response.data;

        // Set the access token in the global state
        setAccessToken(token);

        // Call the login function in your auth store
        login(user);

        // Redirect to the dashboard
        navigate("/dashboard");
      } catch (error) {
        console.error("Login failed:", error);
        setLoginError("فشل تسجيل الدخول. يرجى التحقق من البيانات.");
      }
    }
  };

  return (
    <div className="container">
      {/* Left Side: Branding Section */}
      <div className="left-side">
        <img src={Logo} alt="ScopeSky Logo" className="logo" /> {/* Company logo */}
        <h1>نظام إدارة المكاتب</h1> {/* App name in Arabic */}
      </div>

      {/* Right Side: Login Form Section */}
      <div className="right-side">
        <h2>سجل الدخول</h2> {/* Login header */}

        {/* Display error message if login fails */}
        {loginError && <div className="error-message">{loginError}</div>}

        {/* Reusable form component for username and password */}
        <TextFieldForm
          ref={formRef} // Ref to access form methods
          fields={fields} // Form fields
          hideButtons={true} // Hide default buttons (submit/reset) in TextFieldForm
          formClassName="form" // Form CSS class
          inputClassName="input-field" // Input field CSS class
          fieldWrapperClassName="input-wrapper" // Wrapper class for form fields
        />

        {/* Login Button */}
        <button onClick={handleSubmit} className="login-btn">
          تسجيل الدخول
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
