import React, { useState } from "react";
import useAuthStore from "../store/store.js";
import "./../pages/dashboard.css";
import Logo from "./../assets/Scopesky Logo.png";
import Icons from "./../reusable elements/icons.jsx";
import { Link } from "react-router-dom";
export default function NavBar({ onSidebarToggle }) {
  const { user, profile } = useAuthStore(); // Access both user and profile from store
  const [isNotificationsActive, setIsNotificationsActive] = useState(false);

  const handleNotificationClick = () => {
    setIsNotificationsActive((prev) => !prev);
  };

  return (
    <div className="navbar-container">
      {/* Left Section */}
      <div className="navbar-left">
        {/* Notification Icon */}
        <div
          className={`notification ${isNotificationsActive ? "active" : ""}`}
          onClick={handleNotificationClick}
        >
          <Icons type="notification" width={38} height={20} color="black" />
          <span className="notification-badge"></span>
        </div>
        {/* Notification Dropdown */}
        {isNotificationsActive && (
          <div className="notification-content">
            <p>الاشعارات غير متوفرة في الوقت الحالي</p>
           
          </div>
        )}
        {/* User Info */}
        <div className="user-info">
          <h3>{profile?.fullName || user?.username || "Guest"}</h3>
          <h4>{profile?.position || "الموقع غير معروف"}</h4>
        </div>
        <div className="user-avatar">
          <Link to="settings"> 
          
          <Icons type="user" width={48} height={48} color="#636AE8" />
          </Link>
        </div>
      </div>

      {/* Right Section */}
      <div className="navbar-right">
        <h1 style={{ marginRight: "20px" }}>نظام إدارة المكاتب</h1>
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            onSidebarToggle();
          }}
        >
          
          
          <Icons type="menu" width={45} height={45} />
         
        </div>
        <Link to="landing-page">
        <img src={Logo} alt="Logo" className="navbar-logo" />
        </Link>
      </div>
    </div>
  );
}