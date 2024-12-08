import React from "react";
import { Outlet } from "react-router-dom"; // Import Outlet for nested routes
import NavBar from './../reusable/navBar.jsx';
import "./dashboard.css"; // Import Dashboard styling
import DynamicSidebar from './../reusable/sideBar.jsx';
const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      {/* Fixed NavBar */}

      <NavBar toggleSidebar/>
      {/* Sidebar and Content */}
      <div className="main-layout">
        <DynamicSidebar /> {/* Sidebar */}
        <div className="dashboard-content">
          <Outlet /> {/* Render child routes */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
