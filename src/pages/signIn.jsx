import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./signIn.css";
import Logo from "../assets/Asset 2.png";
import useAuthStore from "./../store/store.js"; // Custom store for managing auth state
import axios from "axios";
import Icons from "../reusable elements/icons.jsx";
import BASE_URL from "../store/url.js"; // Import the base URL

const SignInPage = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility

  // Access global store functions and state
  const { login, isLoggedIn } = useAuthStore();

  const navigateToDashboard = useCallback(() => {
    if (window.location.pathname !== "/dashboard") {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      navigateToDashboard();
    }
  }, [isLoggedIn, navigateToDashboard]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/profile/user-profile`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token as a Bearer token
        },
      });

      const userProfile = response.data;

      console.log("User Profile Response:", userProfile);

      // Save profile data to the global store
      login(token, userProfile);

      // Navigate to dashboard
      navigateToDashboard();
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setLoginError("فشل استرداد ملف تعريف المستخدم.");
    }
  };

  const handleSubmit = async () => {
    if (!username || !password) {
      setLoginError("يرجى إدخال اسم المستخدم وكلمة السر");
      return;
    }

    try {
      // Call login API
      const response = await axios.post(`${BASE_URL}/api/account/login`, {
        username,
        password,
      });

      const { token } = response.data;

      console.log("Login Response:", response.data);

      // Fetch user profile data with the token
      await fetchUserProfile(token);
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        "فشل تسجيل الدخول. يرجى التحقق من البيانات.";
      setLoginError(errorMessage);
    }
  };

  return (
    <div className="container">
      <div className="left-side">
        <img src={Logo} alt="ScopeSky Logo" className="logo" />
        <h1>نظام إدارة المكاتب</h1>
      </div>
      <div className="right-side">
        <h2>سجل الدخول</h2>
        {loginError && <div className="error-message">{loginError}</div>}

        {/* Username Field */}
        <div className="input-wrapper" dir="rtl">
          <label htmlFor="username">اسم المستخدم</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
            className="input-field"
          />
        </div>

        {/* Password Field */}
        <div className="input-wrapper" dir="rtl">
          <label htmlFor="password">كلمة السر</label>
          <div className="password-field-login">
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة السر"
              className="input-field-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              <Icons
                type={passwordVisible ? "eye-off" : "eye"}
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>

        <button onClick={handleSubmit} className="login-btn">
          تسجيل الدخول
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
