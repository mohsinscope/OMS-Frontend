import React from 'react';
import { Building2, Clock, DollarSign, Bell,FileCheck ,BookX,  // for damaged passport
  MonitorX  } from 'lucide-react';
import './landingPage.css';
import useAuthStore from './../store/store.js';
import {Link} from 'react-router-dom'
const LandingPage = () => {
  
  const { isSidebarCollapsed, permissions} = useAuthStore();
  const hasDPrPermission = permissions.includes("DPr");
  const hasArPermission = permissions.includes("Ar");
  const hasEXrPermission = permissions.includes("EXr");
  const hasDDrPermission = permissions.includes("DDr");
  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit'
  };
  return (
    <div className={`landing-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header-title">
          <h1 className="title" style={{textAlign:"center"}}>
            اهلا بكم في نظام إدارة المكاتب
          </h1>
        </div>

        {/* Features List */}
        <div className="features-list">
         
        {/* Expenses Management - Show if user has EXr permission */}
        {hasEXrPermission && (
          <Link to="/supervisor/Expensess" style={linkStyle}>
            <FeatureItem
              icon={<DollarSign className="feature-icon" />}
              title="ادارة المصاريف"
            /></Link>
          )}

          {/* Attendance Management - Show if user has Ar permission */}
          {hasArPermission && (
            <Link to="/supervisor/Attendence" style={linkStyle}>
            <FeatureItem
              icon={<Clock className="feature-icon" />}
              title="ادارة الحضور"
            /></Link>
          )}

          {/* Damaged Passports - Show if user has DPr permission */}
          {hasDPrPermission && (
            <Link to="/supervisor/damagedpasportshistory" style={linkStyle}>
            <FeatureItem
              icon={<BookX className="feature-icon" />}
              title="الجوازات التالفة"
            /></Link>
          )}

          {/* Damaged Devices - Show if user has DDr permission */}
          {hasDDrPermission && (
            <Link to="/supervisor/damegedDevices" style={linkStyle}>

              <FeatureItem
                icon={<MonitorX className="feature-icon" />}
                title="الاجهزة التالفة"
              />

            </Link>
          )}
        </div>
          <p className="subtitle" style={{textAlign:"center", marginTop:"10px "}}>
            تم تطوير الموقع من قبل مطوري شركة سكوب سكاي
          </p>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title }) => {
  return (
    <div className="feature-item">
      <span className="feature-title">{title}</span>
      <div className="icon-wrapper">
        {icon}
      </div>
    </div>
  );
};

export default LandingPage;