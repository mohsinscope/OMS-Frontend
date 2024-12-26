import React, { useState } from "react";
import useAuthStore from "./../store/store.js";
import Icons from "./../reusable elements/icons.jsx";
import axios from "axios";
import "./styles/settings.css";
import BASE_URL from "../store/url.js";

export default function Settings() {
  const { user, accessToken,profile } = useAuthStore();
  const { isSidebarCollapsed } = useAuthStore();
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "غير معروف",  // Use profile.fullName

    username: user?.username || "ali",
    governorate: user?.governorateName || "Basra",
    office: user?.officeName || "Karadah",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidPassword, setIsValidPassword] = useState(false);

  const validatePassword = (password) => {
    // Password must start with capital letter and contain only English characters
    const passwordRegex = /^[A-Z][a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
    return passwordRegex.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Check if input is password or newPassword and validate English characters only
    if ((name === "password" || name === "currentPassword") && value !== "") {
      if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
        setError("يرجى إدخال الحروف الإنجليزية فقط في كلمة المرور");
        return;
      }
      
      if (name === "password") {
        setIsValidPassword(validatePassword(value));
        if (!validatePassword(value)) {
          setError("يجب أن تبدأ كلمة المرور بحرف كبير");
          return;
        }
      }
    }

    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setError("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!formData.currentPassword) {
      setError("الرجاء إدخال كلمة السر الحالية");
      return;
    }
    if (!formData.password) {
      setError("الرجاء إدخال كلمة السر الجديدة");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("كلمات المرور غير متطابقة!");
      return;
    }
    if (!isValidPassword) {
      setError("يجب أن تبدأ كلمة المرور بحرف كبير وتحتوي على حروف إنجليزية فقط");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${BASE_URL}/api/account/change-password`,
        {
          userId: user.id,
          currentPassword: formData.currentPassword,
          newPassword: formData.password
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setSuccess("تم تحديث كلمة المرور بنجاح!");
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        password: "",
        confirmPassword: ""
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        setError("كلمة السر الحالية غير صحيحة");
      } else {
        setError("حدث خطأ أثناء تحديث كلمة المرور");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(prev => ({
      ...prev,
      currentPassword: "",
      password: "",
      confirmPassword: "",
    }));
    setError("");
    setSuccess("");
  };

  return (
    <div
      className={`settings-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : "settings-container"
      }`}
      dir="rtl">
      <h1 className="settings-header">إعدادات الحساب</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-form">
        {/* Existing fields */}
        <label htmlFor="fullName">الاسم الشخصي</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          placeholder="أدخل اسمك الكامل"
        />

        <label htmlFor="username">اسم المستخدم</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          placeholder="اسم المستخدم"
          disabled
        />

        <label htmlFor="governorate">المحافظة</label>
        <input
          type="text"
          id="governorate"
          name="governorate"
          value={formData.governorate}
          placeholder="اسم المحافظة"
          disabled
        />

        <label htmlFor="office">المكتب</label>
        <input
          type="text"
          id="office"
          name="office"
          value={formData.office}
          placeholder="اسم المكتب"
          disabled
        />

        {/* Current Password Field */}
        <label htmlFor="currentPassword">ادخل كلمة السر القديمة لتغيير كلمة السر</label>
        <div className="password-field">
          <input
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            placeholder="أدخل كلمة السر الحالية"
            dir="ltr"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
            <Icons
              type={showCurrentPassword ? "eye-off" : "eye"}
              width={24}
              height={24}
            />
          </button>
        </div>

        {/* New Password Field */}
        <label htmlFor="password">كلمة السر الجديدة</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="أدخل كلمة السر الجديدة"
            dir="ltr"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}>
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
            dir="ltr"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Icons
              type={showConfirmPassword ? "eye-off" : "eye"}
              width={24}
              height={24}
            />
          </button>
        </div>
      </div>

      <div className="settings-buttons-container">
        <button 
          className={`save-button ${loading ? 'disabled' : ''}`} 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button className="cancel-button" onClick={handleCancel}>
          الغاء
        </button>
      </div>
    </div>
  );
}