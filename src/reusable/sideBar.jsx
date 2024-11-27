import React from 'react';
import { Icon } from '@iconify/react';
import './../pages/dashboard.css';
export default function SideBar() {
  return (
    <div className="sidebar" dir="rtl">
      <div className="sidebar-spacer"></div>
      <div className="sidebar-bottom">
        <div className="menu-item">
          <Icon icon="material-symbols:settings-outline" width="24" height="24" />
          <h3>الإعدادات</h3>
        </div>
        <div className="menu-item logout">
          <Icon icon="mdi:logout" width="24" height="24" />
          <h5>تسجيل الخروج</h5>
        </div>
      </div>
    </div>
  );
}
