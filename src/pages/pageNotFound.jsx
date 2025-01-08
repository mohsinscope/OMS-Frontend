import React from 'react';
import { Link } from 'react-router-dom';
import { Home, HelpCircle } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Animated Box Icon */}
        <div className="not-found-icon" />

        {/* 404 Code */}
        <h1 className="not-found-code">404</h1>

        {/* Title and Message */}
        <h2 className="not-found-title">عذراً، الصفحة غير موجودة</h2>
        <p className="not-found-message">
          الصفحة التي تحاول الوصول إليها غير موجودة في نظام إدارة الطلبات. 
          يمكنك العودة إلى الصفحة الرئيسية أو التواصل مع الدعم الفني إذا كنت تعتقد أن هناك مشكلة
        </p>

        {/* Action Buttons */}
        <div className="not-found-buttons">
          <Link to="/" className="not-found-button not-found-button-primary">
            <Home size={20} />
            <span>العودة إلى الرئيسية</span>
          </Link>
          <Link to="/support" className="not-found-button not-found-button-secondary">
            <HelpCircle size={20} />
            <span>اتصل بالدعم</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;