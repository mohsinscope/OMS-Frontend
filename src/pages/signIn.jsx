import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./signIn.css";
import Logo from "../assets/Asset 2.png";
import useAuthStore from "./../store/store.js";
 import axios from "axios";
 import Cookies from "js-cookie";


import Icons from "../reusable elements/icons.jsx";
import BASE_URL from "../store/url.js";

const SignInPage = () => {
  const navigate = useNavigate();

  // Local state
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
 // Unique cookie names for this app
 const ACCESS_COOKIE  = 'oms_access_v1';
 const REFRESH_COOKIE = 'oms_refresh_v1';
 // Only mark Secure on HTTPS (prod). Strict prevents cross-site.
 const cookieOpts = {
   expires: 7,
   sameSite: 'strict',
   secure: window.location.protocol === 'https:'
 };
  // Zustand store actions and state
  const { login, isLoggedIn } = useAuthStore();

  // Navigate to the landing page if logged in
  const navigateToStats = useCallback(() => {
    if (window.location.pathname !== "/landing-page") {
      navigate("/landing-page");
    }
  }, [navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigateToStats();
    }
  }, [isLoggedIn, navigateToStats]);

  // Fetch user profile after successful login
  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/profile/user-profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      throw new Error("فشل استرداد ملف تعريف المستخدم.");
    }
  };

  // Handle login form submission
const handleSubmit = async () => {
  if (!username || !password) {
    setLoginError("يرجى إدخال اسم المستخدم وكلمة السر");
    return;
  }

  setLoading(true);
  setLoginError("");

  try {
    // 1. Perform login request
    const loginResponse = await axios.post(`${BASE_URL}/api/account/login`, {
      username,
      password,
    });

    const { accessToken, refreshToken } = loginResponse.data;

    // 👇👇👇 ADD THIS — Save tokens to cookies
 Cookies.set(ACCESS_COOKIE,  accessToken,  cookieOpts);
 Cookies.set(REFRESH_COOKIE, refreshToken, cookieOpts);

    // 2. Fetch user profile using the access token
    const userProfile = await fetchUserProfile(accessToken);

    // 3. Extract permissions
    const permissions = userProfile.permissions || [];

    // 4. Save in Zustand store
    login(accessToken, refreshToken, userProfile, permissions);

    // 5. Navigate
    navigateToStats();
  } catch (error) {
    console.error("Login failed:", error);
    const errorMessage =
      error.response?.data?.message ||
      "فشل تسجيل الدخول. يرجى التحقق من البيانات.";
    setLoginError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Handle 'Enter' key press for form submission
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="container">
      {/* Left side with logo and title */}
      <div className="left-side">
        <img src={Logo} alt="ScopeSky Logo" className="logo" />
        <h1  id="sign-in-title">نظام إدارة المكاتب</h1>
      </div>

      {/* Right side with login form */}
      <div className="right-side">
        <h2 >سجل الدخول</h2>

        {/* Display login error if exists */}
        {loginError && <div className="error-message">{loginError}</div>}

        {/* Username input */}
        <div className="input-wrapper" dir="rtl">
          <label htmlFor="username">اسم المستخدم</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسم المستخدم"
            className="input-field"
            disabled={loading}
          />
        </div>

        {/* Password input with toggle visibility */}
        <div className="input-wrapper" dir="rtl">
          <label htmlFor="password">كلمة السر</label>
          <div className="password-field-login">
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="كلمة السر"
              className="input-field-password"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setPasswordVisible(!passwordVisible)}
              disabled={loading}
            >
              <Icons
                type={passwordVisible ? "eye-off" : "eye"}
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>

        {/* Login button */}
        <button
          onClick={handleSubmit}
          className={`login-btn ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
