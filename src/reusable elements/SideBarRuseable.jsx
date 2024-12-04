import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/store.js";

const DynamicSidebar = ({
  fetchUrl,
  onLogout,
  currentPath, // Current path to determine active menu item
  sidebarClassName,
  menuItemClassName,
  activeMenuItemClassName,
  logoutClassName,
}) => {
  const { user } = useAuthStore();
  const [roleItems, setRoleItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        if (!user || !user.role) return;

        if (typeof fetchUrl === "string") {
          const response = await fetch(fetchUrl);
          const data = await response.json();
          setRoleItems(data[user.role] || []);
        } else if (typeof fetchUrl === "object") {
          setRoleItems(fetchUrl[user.role] || []);
        } else {
          throw new Error("Invalid fetchUrl format. Must be a URL or JSON object.");
        }
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error.message);
      }
    };

    fetchSidebarData();
  }, [fetchUrl, user]);

  const commonItems = [
    { label: "الإعدادات", icon: "material-symbols:settings-outline", path: "/settings" },
    { label: "تسجيل الخروج", icon: "mdi:logout", action: onLogout },
  ];

  const handleMenuClick = (path, action) => {
    if (action) {
      action();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div className={sidebarClassName || "sidebar"} dir="rtl">
      {/* Top section: Dynamic menu items */}
      <div className="sidebar-top" dir="ltr">
        {roleItems.map((item, index) => (
          <div
            key={index}
            className={`${menuItemClassName} ${
              currentPath === item.path ? activeMenuItemClassName : ""
            }`}
            onClick={() => handleMenuClick(item.path, item.action)}
          >
            <Icon icon={item.icon} width="30" height="30" />
            <h3>{item.label}</h3>
          </div>
        ))}
      </div>

      {/* Bottom section: Common items */}
      <div className="sidebar-bottom" dir="ltr">
        {commonItems.map((item, index) => (
          <div
            key={index}
            className={`${item.label === "تسجيل الخروج" ? logoutClassName : menuItemClassName} ${
              currentPath === item.path ? activeMenuItemClassName : ""
            }`}
            onClick={() => handleMenuClick(item.path, item.action)}
          >
            <Icon icon={item.icon} width="24" height="24" />
            <h3>{item.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

DynamicSidebar.propTypes = {
  fetchUrl: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  onLogout: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired, // Current path to determine active menu item
  sidebarClassName: PropTypes.string,
  menuItemClassName: PropTypes.string,
  activeMenuItemClassName: PropTypes.string,
  logoutClassName: PropTypes.string,
};

export default DynamicSidebar;
