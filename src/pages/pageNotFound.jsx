import React from "react";
import { Link } from "react-router-dom"; // Correct import for Link
import "./NotFound.css"; // Add custom styles if needed

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }} dir="rtl">
      <h1>404</h1>
      <p>عذرًا، الصفحة التي تحاول الوصول إليها غير موجودة.</p>
      <div>
        <Link to="/">
          <button
            style={{
              margin: "10px",
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}>
            العودة إلى الصفحة الرئيسية
          </button>
        </Link>
      </div>
    </div>
  );
}
