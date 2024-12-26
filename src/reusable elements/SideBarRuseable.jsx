import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store";
import { MENU_ITEMS, COMMON_MENU_ITEMS } from "../config/menuConfig";
import Icons from "./icons";
import './../pages/dashboard.css';

const DynamicSidebar = ({
  onLogout,
  currentPath,
  sidebarClassName,
  menuItemClassName,
  activeMenuItemClassName,
  logoutClassName,
}) => {
  const navigate = useNavigate();
  const { roles, isLoggedIn, isSidebarCollapsed } = useAuthStore();
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);
  const [visibleCommonItems, setVisibleCommonItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set initialized after a short delay to ensure store is hydrated
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const filterMenuItems = () => {
      if (!isLoggedIn || !roles || roles.length === 0) {
        setVisibleMenuItems([]);
        setVisibleCommonItems(COMMON_MENU_ITEMS.filter(item => item.role.length === 0));
        return;
      }

      const accessibleMenuItems = MENU_ITEMS.filter((item) => {
        if (!item.role || item.role.length === 0) return true;
        return item.role.some((role) => roles.includes(role));
      });
      setVisibleMenuItems(accessibleMenuItems);

      const accessibleCommonItems = COMMON_MENU_ITEMS.filter((item) => {
        if (!item.role || item.role.length === 0) return true;
        return item.role.some((role) => roles.includes(role));
      });
      setVisibleCommonItems(accessibleCommonItems);
    };

    filterMenuItems();
  }, [roles, isLoggedIn, isInitialized]);

  const handleMenuClick = (path, action) => {
    if (action === "logout") {
      onLogout();
    } else if (path) {
      navigate(path);
    }
  };

  const renderMenuItem = React.useCallback((item, index) => {
    const isActive = currentPath === item.path;
    const activeColor = "#1677ff";
    const itemClass = `${menuItemClassName || 'menu-item'} ${
      isActive ? activeMenuItemClassName || 'active' : ''
    }`;

    return (
      <div
        key={item.path || index}
        className={itemClass}
        onClick={() => handleMenuClick(item.path, item.action)}
      >
        <Icons 
          type={item.icon} 
          color={isActive ? activeColor : "currentColor"}
        />
        <h3 style={{ color: isActive ? activeColor : "" }}>{item.label}</h3>
      </div>
    );
  }, [currentPath, menuItemClassName, activeMenuItemClassName]);

  if (!isInitialized) {
    return null; // Or return a loading spinner
  }

  if (!isLoggedIn && visibleCommonItems.length === 0) {
    return null;
  }

  return (
    <div className={`${sidebarClassName || "sidebar"} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {visibleMenuItems.length > 0 && (
        <div className="sidebar-top">
          {visibleMenuItems.map(renderMenuItem)}
        </div>
      )}

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

export default React.memo(DynamicSidebar);