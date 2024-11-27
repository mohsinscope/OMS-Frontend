import React from 'react';
import { Icon } from '@iconify/react';
import Data from './../data/users.json'; // Importing the JSON file
import './../pages/dashboard.css';
import Logo from './../assets/Scopesky Logo.png';
export default function NavBar() {
  // Assuming `users.json` contains an array of user objects, select the first user for this example.
  const user = Data[0]; // Replace with logic to dynamically pick the logged-in user
  const { username, role } = user;

  return (
    <div className="navbar-container">
      {/* Left Section: Notifications and User Info */}
      <div className="navbar-left">
        <div className="notification">
          <Icon icon="material-symbols:notifications" width="30" height="30 " />
          <span className="notification-badge"></span>
        </div>
        <div className="user-info">
          <h3>{username}</h3>
          <h4>{role}</h4>
        </div>
        <div className="user-avatar">
          <Icon icon="material-symbols:person" width="45" height="45" />
        </div>
      </div>

      {/* Right Section: Logo and Title */}
      <div className="navbar-right">
        <h1>نظام إدارة المكاتب</h1>
        <Icon icon="gg:menu" width="45" height="45" />
                <img src={Logo} alt="Logo" className="navbar-logo" />
      </div>
    </div>
  );
}
