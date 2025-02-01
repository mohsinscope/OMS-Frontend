import React from 'react';
import { Building2, Clock, DollarSign, Bell,FileCheck ,BookX,  // for damaged passport
  MonitorX  } from 'lucide-react';
import './landingPage.css';
import useAuthStore from './../store/store.js';
import {Link} from 'react-router-dom'
const LandingPage = () => {
  
  const { isSidebarCollapsed} = useAuthStore();
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
         
          <FeatureItem
            icon={<DollarSign className="feature-icon" />}
            title="ادارة المصاريف"
            />
           
                 

          <FeatureItem
            icon={<Clock className="feature-icon" />}
            title="ادارة الحضور"
          />

                     
          <FeatureItem
            icon={<BookX  className="feature-icon" />}
            title="الجوازات التالفة"
          />

          <FeatureItem
            icon={<MonitorX  className="feature-icon" />}
            title="الاجهزة التالفة"
          />
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