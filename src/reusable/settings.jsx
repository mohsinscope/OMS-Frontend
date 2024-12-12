import React, { useState } from "react";
import useAuthStore from "./../store/store.js";
import Icons from "./../reusable elements/icons.jsx";
import "./styles/settings.css";

export default function Settings() {
  const { user } = useAuthStore(); // Access user data from the store
  const userRole = user?.role || "user"; // Get user role, defaulting to "user"
  const isAdmin = userRole === "admin"; // Determine if the user is an admin

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.email || "محمد علي",
    username: user?.username || "mohamed123",
    governorate: user?.governorate || "بغداد",
    office: user?.office || "الرصافة",
    password: "", // Leave empty for setting a new password
    confirmPassword:user?.Password|| "", // Leave empty for confirmation
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSave = () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (formData.password === "") {
      alert("Password cannot be empty!");
      return;
    }
    // TODO: Add API call to save updated user data
    console.log("Saving user data:", formData);
    alert("Password updated successfully!");
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "محمد علي",
      username: user?.username || "mohamed123",
      governorate: user?.governorate || "بغداد",
      office: user?.office || "الرصافة",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="settings-container" dir="rtl">
      <h1 className="settings-header">إعدادات الحساب</h1>
      <div className="settings-form">
        {/* Full Name Field */}
        <label htmlFor="fullName">الاسم الشخصي</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          disabled={!isAdmin}
        />

        {/* Username Field */}
        <label htmlFor="username">اسم المستخدم</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          disabled={!isAdmin}
        />

        {/* Governorate Field */}
        <label htmlFor="governorate">المحافظة</label>
        <input
          type="text"
          id="governorate"
          name="governorate"
          value={formData.governorate}
          onChange={handleInputChange}
          disabled={!isAdmin}
        />

        {/* Office Field */}
        <label htmlFor="office">المكتب</label>
        <input
          type="text"
          id="office"
          name="office"
          value={formData.office}
          onChange={handleInputChange}
          disabled={!isAdmin}
        />

        {/* Password Field */}
        <label htmlFor="password">كلمة السر الجديدة</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder=""
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            <Icons
              type={showPassword ? "eye-off" : "eye"}
              width={24}
              height={24}
            />
          </button>
        </div>

        {/* Confirm Password Field */}
        <label htmlFor="confirmPassword">تأكيد كلمة السر</label>
        <div className="password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder=""
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icons
              type={showConfirmPassword ? "eye-off" : "eye"}
              width={24}
              height={24}
            />
          </button>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="settings-buttons-container">
        <button className="save-button" onClick={handleSave}>
          حفظ
        </button>
        <button className="cancel-button" onClick={handleCancel}>
          الغاء
        </button>
      </div>
    </div>
  );
}
