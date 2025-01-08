import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import './forbidden.css';
const Forbidden = () => {
  return (
    <div className="forbidden-container">
      <div className="forbidden-content">
        {/* Animated Lock Icon */}
        <div className="forbidden-icon" />

        {/* 403 Code */}
        <h1 className="forbidden-code">403</h1>

        {/* Title and Message */}
        <h2 className="forbidden-title">صفحة محظورة</h2>
        <p className="forbidden-message">
          انت غير مخول للدخول لهذه الصفحة.
          يرجى التأكد من صلاحياتك أو التواصل مع مسؤول النظام للحصول على المساعدة.
        </p>

        {/* Action Buttons */}
        <div className="forbidden-buttons">
          <Link to="/" className="forbidden-button forbidden-button-primary">
            <Home size={20} />
            <span>العودة إلى الرئيسية</span>
          </Link>
        
        </div>
      </div>
    </div>
  );
};

export default Forbidden;