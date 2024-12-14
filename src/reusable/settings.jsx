import React, { useState } from "react";
import useAuthStore from "./../store/store.js";
import Icons from "./../reusable elements/icons.jsx";
import "./styles/settings.css";

export default function Settings() {
  const { user } = useAuthStore(); // Access user data from the store

  // Initialize form state with user data
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "محمد علي",
    username: user?.username || "ali", // Correctly mapped from the body
    governorate: user?.governorateName || "Basra", // Correctly mapped from the body
    office: user?.officeName || "Karadah", // Correctly mapped from the body
    password: "", // Leave empty for setting a new password
    confirmPassword: "", // Leave empty for confirmation
  });

  // State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Save user data
  const handleSave = () => {
    if (formData.password !== formData.confirmPassword) {
      alert("كلمات المرور غير متطابقة!");
      return;
    }

    if (formData.password === "") {
      alert("كلمة المرور لا يمكن أن تكون فارغة!");
      return;
      
    }

    // TODO: Add API call to save updated user data
    console.log("Saving user data:", formData);
    alert("تم تحديث كلمة المرور بنجاح!");
  };
  console.log("User data:", user);


  // Reset form data
  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "محمد علي",
      username: user?.username || "ali",
      governorate: user?.governorateName || "Basra",
      office: user?.officeName || "Karadah",
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
          placeholder="أدخل اسمك الكامل"
        />

        {/* Username Field */}
        <label htmlFor="username">اسم المستخدم</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder="اسم المستخدم"
          disabled // Non-editable
        />

        {/* Governorate Field */}
        <label htmlFor="governorate">المحافظة</label>
        <input
          type="text"
          id="governorate"
          name="governorate"
          value={formData.governorate}
          placeholder="اسم المحافظة"
          disabled // Non-editable
        />

        {/* Office Field */}
        <label htmlFor="office">المكتب</label>
        <input
          type="text"
          id="office"
          name="office"
          value={formData.office}
          placeholder="اسم المكتب"
          disabled // Non-editable
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
            placeholder="أدخل كلمة السر الجديدة"
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
            placeholder="تأكيد كلمة السر"
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
