import React from 'react';
import { Building2, Clock, DollarSign, Bell } from 'lucide-react';
import './landingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container" dir="rtl">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <h1 className="title" style={{textAlign:"center"}}>
            اهلا بكم في نظام إدارة المكاتب
          </h1>
        </div>

        {/* Features List */}
        <div className="features-list">
          <FeatureItem
            icon={<Building2 className="feature-icon" />}
            title="ادارة المكاتب"
          />
          <FeatureItem
            icon={<Clock className="feature-icon" />}
            title="ادارة الحضور"
          />
          <FeatureItem
            icon={<DollarSign className="feature-icon" />}
            title="ادارة المصاريف"
          />
          <FeatureItem
            icon={<Bell className="feature-icon" />}
            title="الاشعارات"
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