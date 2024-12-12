import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TextFieldForm from "./../reusable elements/ReuseAbleTextField.jsx";
import "./signIn.css";
import Logo from "../assets/Asset 2.png";
import useAuthStore from "./../store/store.js";
import axios from "axios";

const SignInPage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loginError, setLoginError] = useState("");

  const { login, isLoggedIn } = useAuthStore();

  const fields = [
    { name: "username", placeholder: "اسم المستخدم", type: "text" },
    { name: "password", placeholder: "كلمة السر", type: "password" },
  ];

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

  const handleSubmit = async () => {
    if (formRef.current) {
      const formData = formRef.current.getFormData();
      const { username, password } = formData;

      if (!username || !password) {
        setLoginError("يرجى إدخال اسم المستخدم وكلمة السر");
        return;
      }

      try {
        const response = await axios.post(
          "http://localhost:5214/api/account/login",
          { username, password }
        );

        const { token } = response.data;

        console.log(response.data); // Log the API response to inspect its structure

        login(token); // Pass the token to the login function

        navigateToDashboard();
      } catch (error) {
        console.error("Login failed:", error);
        const errorMessage =
          error.response?.data?.message ||
          "فشل تسجيل الدخول. يرجى التحقق من البيانات.";
        setLoginError(errorMessage);
      }
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
        <TextFieldForm
          ref={formRef}
          fields={fields}
          hideButtons={true}
          formClassName="form"
          inputClassName="input-field"
          fieldWrapperClassName="input-wrapper"
        />
        <button onClick={handleSubmit} className="login-btn">
          تسجيل الدخول
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
