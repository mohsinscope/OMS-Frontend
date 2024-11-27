import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import TextFieldForm from "../reusable elements/ReuseAbleTextField";
import "./signIn.css";
import Logo from "../assets/Asset 2.png";
import dataUsers from "../data/users.json";

const SignInPage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null); // Ref to access TextFieldForm's methods

  const fields = [
    { name: "username", placeholder: "اسم المستخدم", type: "text" },
    { name: "password", placeholder: "كلمة السر", type: "password" },
  ];

  const handleLoginSuccess = () => {
    navigate("/dashboard"); // Redirect to dashboard on success
  };

  const handleError = (error) => {
    // Optional: Handle fetch error (e.g., log or display a message)
  };

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.submit(); // Trigger the form submission
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
        <TextFieldForm
          ref={formRef} // Pass the ref to TextFieldForm
          fields={fields}
          fetchUrl={dataUsers}
          onFormSubmit={handleLoginSuccess} // Handle login success
          onError={handleError}
          formClassName="form"
          inputClassName="input-field"
          errorClassName="error-message"
        />
        <button onClick={handleSubmit} className="login-btn">
          تسجيل الدخول
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
