import React, { useState } from "react";
import useAuthStore from "./../store/store.js"; // Hook to fetch logged-in user info
import "./../pages/dashboard.css"; // Custom CSS file for the NavBar
import Logo from "./../assets/Scopesky Logo.png"; // Importing the logo
import Icons from "./../reusable elements/icons.jsx";

export default function NavBar({ onSidebarToggle }) {
  const { user } = useAuthStore(); // Fetch logged-in user's information
  const [isNotificationsActive, setIsNotificationsActive] = useState(false); // State to manage notification dropdown visibility

  // Function to toggle notification dropdown visibility
  const handleNotificationClick = () => {
    setIsNotificationsActive((prev) => !prev); // Toggle the state
  };

  return (
    <div className="navbar-container">
      {/* Left Section */}
      <div className="navbar-left">
        {/* Notification Icon */}
        <div
          className={`notification ${isNotificationsActive ? "active" : ""}`} // Add 'active' class if notifications are active
          onClick={handleNotificationClick} // Handle notification icon click
        >
          <Icons type="notification" width={38} height={20} color="black"/>{" "}
          {/* Notification bell icon */}
          <span className="notification-badge"></span>{" "}
          {/* Badge for unread notifications */}
        </div>

        {/* Notification Dropdown */}
        {isNotificationsActive && (
          <div className="notification-content">
            <p >New notification!</p> {/* Sample notification */}
            <p>You have a meeting at 3 PM.</p> {/* Sample notification */}
          </div>
        )}

        {/* User Info */}
        <div className="user-info">
          <h3>{user?.username || "Guest"}</h3>{" "}
          {/* Display username or fallback to "Guest" */}
          <h4>{user?.role || "Unknown Role"}</h4>{" "}
          {/* Display user role or fallback to "Unknown Role" */}
        </div>

        {/* User Avatar */}
        <div className="user-avatar">
          <Icons type="user" width={48} height={48} color="#636AE8" />{" "}
          {/* Default person avatar icon */}
        </div>
      </div>

      {/* Right Section */}
      <div className="navbar-right">
        <h1 style={{ marginRight: "20px" }}>نظام إدارة المكاتب</h1>{" "}
        {/* Title of the system in Arabic */}
        <div style={{cursor:"pointer"}} onClick={() => {
            onSidebarToggle();
          }}>

        <Icons
          type="menu" // Hamburger menu icon
          width={45}
          height={45}
         
        
          style={{ cursor: "pointer" }} // Pointer cursor for better UX
        />
        </div>
        <img src={Logo} alt="Logo" className="navbar-logo" />{" "}
        {/* Display the company logo */}
      </div>
    </div>
  );
}
