import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store"; // Access roles from the store
import { MENU_ITEMS, COMMON_MENU_ITEMS } from "../config/menuConfig";
import Icons from "./icons";

const DynamicSidebar = ({
  onLogout,
  currentPath,
  sidebarClassName,
  menuItemClassName,
  activeMenuItemClassName,
  logoutClassName,
}) => {
  const navigate = useNavigate();
  const { roles } = useAuthStore(); // Get roles from the store
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);
  const [visibleCommonItems, setVisibleCommonItems] = useState([]);

  useEffect(() => {
    const filterMenuItems = () => {
      if (!roles || roles.length === 0) return;

      // Filter `MENU_ITEMS` based on roles
      const accessibleMenuItems = MENU_ITEMS.filter((item) =>
        item.role.some((role) => roles.includes(role))
      );
      setVisibleMenuItems(accessibleMenuItems);

      // Filter `COMMON_MENU_ITEMS` (if you want to restrict them)
      const accessibleCommonItems = COMMON_MENU_ITEMS.filter(
        (item) => item.role.length === 0 || item.role.some((role) => roles.includes(role))
      );
      setVisibleCommonItems(accessibleCommonItems);
    };

    filterMenuItems();
  }, [roles]);

  const handleMenuClick = (path, action) => {
    if (action === "logout") {
      onLogout();
    } else if (path) {
      navigate(path);
    }
  };

  const renderMenuItem = (item, index) => {
    const isActive = currentPath === item.path;

    return (
      <div
        key={index}
        className={`${menuItemClassName} ${isActive ? activeMenuItemClassName : ""}`}
        onClick={() => handleMenuClick(item.path, item.action)}
      >
        <Icons type={item.icon} />
        <h3>{item.label}</h3>
      </div>
    );
  };

  return (
    <div className={sidebarClassName || "sidebar"}>
      {/* Main Menu Items */}
      <div className="sidebar-top">
        {visibleMenuItems.map((item, index) => renderMenuItem(item, index))}
      </div>

      {/* Common Menu Items */}
      <div className="sidebar-bottom">
        {visibleCommonItems.map((item, index) => renderMenuItem(item, index))}
      </div>
    </div>
  );
};

DynamicSidebar.propTypes = {
  onLogout: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
  sidebarClassName: PropTypes.string,
  menuItemClassName: PropTypes.string,
  activeMenuItemClassName: PropTypes.string,
  logoutClassName: PropTypes.string,
};

export default DynamicSidebar;
