
import Dashboard from "./../pages/dashBoard.jsx"; // Import the Dashboard component
import useAuthStore from "./../store/store.js"; // Import the authentication store
import { useState } from "react"; // Import useState hook from React
import { Icon } from "@iconify/react"; // Import Iconify for icons
import './styles/settings.css';
export default function Settings() {
  // Fetch the currently logged-in user's data from the authentication store
  const { user } = useAuthStore(); // Destructure the `user` property from the store
  const userRole = user?.role || "user"; // Get the user's role, defaulting to "user" if undefined

  // Check if the logged-in user is an admin
  const isAdmin = userRole === "admin";

  // State to toggle the visibility of the password fields
  const [showPassword, setShowPassword] = useState(false); // For the main password field
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For the confirm password field

  return (
    <>
      {/* Dashboard Component */}
      <Dashboard />

      {/* Settings Container */}
      <div className="settings-container" dir="rtl">
        {/* Page Header */}
        <h1 className="settings-header">إعدادات الحساب</h1>

        {/* Form Section */}
        <div className="settings-form">
          {/* Full Name Field */}
          <label htmlFor="fullName">الاسم الشخصي</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            defaultValue={user?.fullName || "محمد علي"} // Default value fetched from the user store /* هاي هنا ملاحظة دائما نخلي قيمة افتراضية ثانية حتلو متاكدين تجينه فد ريسبونس حتى لا يضرب ايرور  */
            disabled={!isAdmin} // Disable the field if the user is not an admin
          />

          {/* Username Field */}
          <label htmlFor="username">اسم المستخدم</label>
          <input
            type="text"
            id="username"
            name="username"
            defaultValue={user?.username || "mohamed123"}
            disabled={!isAdmin} // Disable if the user is not an admin
          />

          {/* Governorate Field */}
          <label htmlFor="governorate">المحافظة</label>
          <input
            type="text"
            id="governorate"
            name="governorate"
            defaultValue={user?.governorate || "بغداد"}
            disabled={!isAdmin} // Disable if the user is not an admin
          />

          {/* Office Field */}
          <label htmlFor="office">المكتب</label>
          <input
            type="text"
            id="office"
            name="office"
            defaultValue={user?.office || "الرصافة"}
            disabled={!isAdmin} // Disable if the user is not an admin
          />

          {/* Password Field */}
          <label htmlFor="password">كلمة السر</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"} // Toggle visibility
              id="password"
              name="password"
              defaultValue={user?.password || ""} // Fetch from the user store if available
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)} // Toggle the password visibility
            >
              <Icon
                icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} // Change icon based on visibility state
                width="24"
                height="24"
              />
            </button>
          </div>

          {/* Confirm Password Field */}
          <label htmlFor="confirmPassword">تأكيد كلمة السر</label>
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"} // Toggle visibility
              id="confirmPassword"
              name="confirmPassword"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              } // Toggle the confirm password visibility
            >
              <Icon
                icon={
                  showConfirmPassword
                    ? "mdi:eye-off-outline"
                    : "mdi:eye-outline"
                } // Change icon based on visibility state
                width="24"
                height="24"
              />
            </button>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="settings-buttons-container">
          <button className="save-button">حفظ</button> {/* Save button */}
          <button className="cancel-button">الغاء</button> {/* Cancel button */}
        </div>
      </div>
    </>
  );
}
