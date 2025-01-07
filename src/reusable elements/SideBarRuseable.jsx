import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store";
import { MENU_ITEMS, COMMON_MENU_ITEMS } from "../config/menuConfig";
import Icons from "./icons";
import axios from "axios";
import Url from "../store/url";
import "./../pages/dashboard.css";

const DynamicSidebar = ({
  onLogout,
  currentPath,
  sidebarClassName,
  menuItemClassName,
  activeMenuItemClassName,
  logoutClassName,
}) => {
  const navigate = useNavigate();
  const { permissions, roles, isLoggedIn, isSidebarCollapsed, toggleSidebar } = useAuthStore();
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);
  const [visibleCommonItems, setVisibleCommonItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const filterMenuItems = () => {
      if (!isLoggedIn || (!permissions && !roles) || (permissions?.length === 0 && roles?.length === 0)) {
        setVisibleMenuItems([]);
        setVisibleCommonItems(COMMON_MENU_ITEMS.filter((item) => item.role.length === 0));
        return;
      }

      const accessibleMenuItems = MENU_ITEMS.filter((item) => {
        // Check for role-based access first
        if (item.role && item.role.length > 0) {
          return item.role.some(role => roles.includes(role));
        }
        // Then check for permission-based access
        if (item.requiredPermission) {
          return permissions.includes(item.requiredPermission);
        }
        return false; // If neither role nor permission is specified, hide the item
      });

      setVisibleMenuItems(accessibleMenuItems);
      setVisibleCommonItems(COMMON_MENU_ITEMS);
    };

    filterMenuItems();
  }, [permissions, roles, isLoggedIn, isInitialized]);

  // Function to refresh the token
  const refreshTokenAPI = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      const response = await axios.post(
        `${Url}/api/account/refresh-token`,
        {
          AccessToken: localStorage.getItem("accessToken"),
          RefreshToken: refreshToken,
        }
      );
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      onLogout(); // Logout if refresh token fails
      return false;
    }
  };

  // Function to check if token is expired
  const tokenIsExpired = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert expiration to milliseconds
    return Date.now() > expirationTime;
  };

  const handleMenuClick = async (path, action) => {
    const token = localStorage.getItem("accessToken");

    // If token is expired or not available, refresh the token
    if (!token || tokenIsExpired(token)) {
      const tokenRefreshed = await refreshTokenAPI();
      if (!tokenRefreshed) return; // If refresh fails, stop the navigation
    }

    // If refresh is successful or token is valid, navigate to the path
    if (action === "logout") {
      onLogout();
    } else if (path) {
      navigate(path);
    }
  };

  const renderMenuItem = React.useCallback(
    (item, index) => {
      const isActive =
        currentPath === item.path ||
        (currentPath.startsWith(item.path) && item.path !== "/");
      const activeColor = "#1677ff";
      const itemClass = `${menuItemClassName || "menu-item"} ${
        isActive ? activeMenuItemClassName || "active" : ""
      }`;

      return (
        <div
          key={item.path || index}
          className={itemClass}
          onClick={() => handleMenuClick(item.path, item.action)}
          style={{ cursor: "pointer" }}
        >
          <Icons type={item.icon} color={isActive ? "#1677ff" : "currentColor"} />
          <h3 style={{ color: isActive ? activeColor : "" }}>{item.label}</h3>
        </div>
      );
    },
    [currentPath, menuItemClassName, activeMenuItemClassName]
  );

  if (!isInitialized) {
    return null;
  }

  if (!isLoggedIn && visibleCommonItems.length === 0) {
    return null;
  }

  return (
    <div
      className={`${sidebarClassName || "sidebar"} ${
        isSidebarCollapsed ? "collapsed" : ""
      }`}
    >
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
