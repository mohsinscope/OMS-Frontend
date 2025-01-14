import React, { useState } from "react";
import { Modal, Button, message, ConfigProvider } from "antd";
import useAuthStore from "./../store/store.js";
import Icons from "./../reusable elements/icons.jsx";
import axios from "axios";
import "./styles/settings.css";
import BASE_URL from "../store/url.js";

export default function Settings() {
  const { user, accessToken, profile } = useAuthStore();
  const { isSidebarCollapsed } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "غير معروف",
    username: user?.username || "ali",
    governorate: profile?.governorateName || "Basra",
    office: profile?.officeName || "Karadah",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Current Password, Step 2: New Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const passwordRegex =
      /^[A-Z][a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
    return passwordRegex.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prevData) => ({ ...prevData, [name]: value }));
    setError("");
  };

  const handleNextStep = () => {
    if (!passwordData.currentPassword) {
      message.error("يرجى إدخال كلمة السر الحالية");
      return;
    }
    setStep(2);
  };

  const handleSavePassword = async () => {
    const { newPassword, confirmPassword } = passwordData;

    if (!newPassword || !confirmPassword) {
      message.error("يرجى ملء جميع الحقول");
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error("كلمات المرور غير متطابقة");
      return;
    }

    if (!validatePassword(newPassword)) {
      message.error("يجب أن تبدأ كلمة المرور بحرف كبير");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${BASE_URL}/api/account/change-password`,
        {
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      message.success("تم تغيير كلمة المرور بنجاح");
      setShowModal(false);
      setStep(1);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      if (error.response?.status === 401) {
        message.error("كلمة المرور الحالية غير صحيحة");
      } else {
        message.error("حدث خطأ أثناء تغيير كلمة المرور");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="settings-container" 
      dir="rtl">
      <h1 className="settings-header">إعدادات الحساب</h1>

      <div className="settings-form">
        <label htmlFor="fullName">الاسم الشخصي</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          placeholder="أدخل اسمك الكامل"
          disabled
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
      </div>

      <div className="settings-buttons-container">
        <button
          className={`save-button ${loading ? "disabled" : ""}`}
          onClick={() => setShowModal(true)}>
          تغيير كلمة السر
        </button>
        <button className="cancel-button" onClick={() => setShowModal(false)}>
          الغاء
        </button>
      </div>

      {/* Modal for Changing Password */}
      <ConfigProvider direction="rtl">
        <Modal
          title={
            step === 1 ? "أدخل كلمة السر الحالية" : "أدخل كلمة السر الجديدة"
          }
          open={showModal}
          onCancel={() => {
            setShowModal(false);
            setStep(1);
            setPasswordData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
          }}
          onOk={step === 1 ? handleNextStep : handleSavePassword}
          okText={step === 1 ? "التالي" : "حفظ"}
          cancelText="إلغاء"
          confirmLoading={loading}>
          {step === 1 ? (
            <div className="modal-content">
              <label htmlFor="currentPassword">كلمة المرور الحالية</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handleInputChange}
                placeholder="أدخل كلمة المرور الحالية"
                dir="rtl"
              />
            </div>
          ) : (
            <div className="modal-content">
              <label htmlFor="newPassword">كلمة المرور الجديدة</label>
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleInputChange}
                placeholder="أدخل كلمة المرور الجديدة"
                dir="rtl"
              />
              <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handleInputChange}
                placeholder="تأكيد كلمة المرور"
                dir="rtl"
              />
            </div>
          )}
        </Modal>
      </ConfigProvider>
    </div>
  );
}
