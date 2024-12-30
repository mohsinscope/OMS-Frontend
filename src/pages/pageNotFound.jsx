import React from "react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css"; // إذا أردت إضافة تنسيق مخصص

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }} dir="rtl">
      <h1>404</h1>
      <p>عذرًا، الصفحة التي تحاول الوصول إليها غير موجودة.</p>
      <div>
        <button
          onClick={() => navigate(-1)}
          style={{
            margin: "10px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}>
          العودة للصفحة السابقة
        </button>
      </div>
    </div>
  );
}
