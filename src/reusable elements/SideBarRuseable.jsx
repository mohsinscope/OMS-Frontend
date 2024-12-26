import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store";
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
  const { roles, isLoggedIn } = useAuthStore(); // Add isLoggedIn check
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);
  const [visibleCommonItems, setVisibleCommonItems] = useState([]);

  useEffect(() => {
    const filterMenuItems = () => {
      // Check both roles and isLoggedIn
      if (!isLoggedIn || !roles || roles.length === 0) {
        setVisibleMenuItems([]);
        setVisibleCommonItems(COMMON_MENU_ITEMS.filter(item => item.role.length === 0));
        return;
      }

      // Filter menu items based on roles
      const accessibleMenuItems = MENU_ITEMS.filter((item) => {
        // If no roles specified for item, make it accessible to all logged-in users
        if (!item.role || item.role.length === 0) return true;
        // Otherwise check if user has required role
        return item.role.some((role) => roles.includes(role));
      });
      setVisibleMenuItems(accessibleMenuItems);

      // Filter common items
      const accessibleCommonItems = COMMON_MENU_ITEMS.filter((item) => {
        if (!item.role || item.role.length === 0) return true;
        return item.role.some((role) => roles.includes(role));
      });
      setVisibleCommonItems(accessibleCommonItems);
    };

    filterMenuItems();
  }, [roles, isLoggedIn]); // Add isLoggedIn to dependencies

  const handleMenuClick = (path, action) => {
    if (action === "logout") {
      onLogout();
    } else if (path) {
      navigate(path);
    }
  };

  // Memoize the menu item rendering to prevent unnecessary re-renders
  const renderMenuItem = React.useCallback((item, index) => {
    const isActive = currentPath === item.path;
    const itemClass = `${menuItemClassName || 'menu-item'} ${
      isActive ? activeMenuItemClassName || 'active' : ''
    }`;

    return (
      <div
        key={item.path || index} // Use path as key if available
        className={itemClass}
        onClick={() => handleMenuClick(item.path, item.action)}
      >
        <Icons type={item.icon} />
        <h3>{item.label}</h3>
      </div>
    );
  }, [currentPath, menuItemClassName, activeMenuItemClassName]);

  // Early return if not logged in and no public items
  if (!isLoggedIn && visibleCommonItems.length === 0) {
    return null;
  }

  return (
    <div className={sidebarClassName || "sidebar"}>
      {/* Main Menu Items */}
      {visibleMenuItems.length > 0 && (
        <div className="sidebar-top">
          {visibleMenuItems.map(renderMenuItem)}
        </div>
      )}

      {/* Common Menu Items */}
      {visibleCommonItems.length > 0 && (
        <div className="sidebar-bottom">
          {visibleCommonItems.map(renderMenuItem)}
        </div>
      )}
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

export default React.memo(DynamicSidebar); // Memoize the entire component