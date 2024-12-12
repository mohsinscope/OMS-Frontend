import React, { useState } from "react";
import useAuthStore from "../store/store.js";
import "./../pages/dashboard.css";
import Logo from "./../assets/Scopesky Logo.png";
import Icons from "./../reusable elements/icons.jsx";

export default function NavBar({ onSidebarToggle }) {
  const { user } = useAuthStore(); // Access user state from Zustand
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
            <p>New notification!</p>
            <p>You have a meeting at 3 PM.</p>
          </div>
        )}
        {/* User Info */}
        <div className="user-info">
          <h3>{user?.username || "Guest"}</h3>
          <h4>{user?.role || "Unknown Role"}</h4>
        </div>
        <div className="user-avatar">
          <Icons type="user" width={48} height={48} color="#636AE8" />
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
        <img src={Logo} alt="Logo" className="navbar-logo" />
      </div>
    </div>
  );
}
