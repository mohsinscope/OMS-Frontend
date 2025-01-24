import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store";
import { MENU_ITEMS, COMMON_MENU_ITEMS } from "../config/menuConfig";
import Icons from "./icons";
import axios from "axios";
import Url from "../store/url";
import "./../pages/dashboard.css";

// Create an axios instance with interceptor
const axiosInstance = axios.create();

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh the token
  const refreshTokenAPI = async () => {
    if (isRefreshing) return null;
    
    setIsRefreshing(true);
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
      setIsRefreshing(false);
      return accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      setIsRefreshing(false);
      onLogout(); // Logout if refresh token fails
      return null;
    }
  };

  // Setup axios interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const newToken = await refreshTokenAPI();
          if (newToken) {
            // Update the authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on component unmount
    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, []);

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
        if (item.role && item.role.length > 0) {
          return item.role.some(role => roles.includes(role));
        }
        if (item.requiredPermission) {
          return permissions.includes(item.requiredPermission);
        }
        return false;
      });

      setVisibleMenuItems(accessibleMenuItems);
      setVisibleCommonItems(COMMON_MENU_ITEMS);
    };

    filterMenuItems();
  }, [permissions, roles, isLoggedIn, isInitialized]);

  // Function to check if token is expired
  const tokenIsExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() > expirationTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      return true;
    }
  };

  const handleMenuClick = async (path, action) => {
    const token = localStorage.getItem("accessToken");

    if (!token || tokenIsExpired(token)) {
      const newToken = await refreshTokenAPI();
      if (!newToken) return;
    }

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
  const handleOverlayClick = () => {
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  return (
    <>
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
    <div className="sidebar-overlay" onClick={handleOverlayClick} />
    </>
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