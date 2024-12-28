import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./signIn.css";
import Logo from "../assets/Asset 2.png";
import useAuthStore from "./../store/store.js";
import axios from "axios";
import Icons from "../reusable elements/icons.jsx";
import BASE_URL from "../store/url.js";

const SignInPage = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false); // State to handle loading state

  // Access global store functions and state
  const { login, isLoggedIn } = useAuthStore();

  const navigateToStats = useCallback(() => {
    if (window.location.pathname !== "/landing-page") {
      navigate("/landing-page"); // Redirect to stats after login
    }
  }, [navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      navigateToStats(); // Redirect to stats if already logged in
    }
  }, [isLoggedIn, navigateToStats]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/profile/user-profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const userProfile = response.data;
      console.log("User Profile Response:", userProfile);
  
      // Default permissions object if your API doesn't provide it
      const permissions = userProfile.permissions || {};
  
      // Save profile data to the global store with all required parameters
      login(token, userProfile, permissions);
      navigateToStats();
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

    setLoading(true); // Set loading state
    setLoginError(""); // Reset error state

    try {
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
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="container">
      <div className="left-side">
        <img src={Logo} alt="ScopeSky Logo" className="logo" />
        <h1 style={{marginLeft:"6%"}}>نظام إدارة المكاتب</h1>
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
            disabled={loading} // Disable during loading
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
              disabled={loading} // Disable during loading
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setPasswordVisible(!passwordVisible)}
              disabled={loading} // Disable during loading
            >
              <Icons
                type={passwordVisible ? "eye-off" : "eye"}
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`login-btn ${loading ? "loading" : ""}`}
          disabled={loading} // Disable button during loading
        >
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
